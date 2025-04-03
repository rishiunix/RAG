import { Construct } from 'constructs';
import { EcsClusterStack } from '../../fargate-service/ecsClusterStack';
import { EcsServiceStack } from '../../fargate-service/ecsServiceStack';
import {
  Choice,
  Condition,
  DefinitionBody,
  JitterType,
  Pass,
  StateMachine,
  Timeout,
} from 'aws-cdk-lib/aws-stepfunctions';
import { StepFunctionStates } from '../../enums/stepFunctionStates';
import { StepFunctionStackProps } from '../stepFunctionStack';
import { createEcsStateForStepFunction } from '../utils';
import { EcsRunTask } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Duration } from 'aws-cdk-lib';
import { modelEvaluationScoringConditionalIdentifier } from '../../constants/stepFunctionConstants';

export function createModelEvaluationWorkflow(
  scope: Construct,
  ecsClusterStack: EcsClusterStack,
  ecsServiceStack: EcsServiceStack,
  props: StepFunctionStackProps,
): StateMachine {
  const cleanUpTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.CLEANUP_TASK,
    props,
  );

  const prepareDatasetTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.PREPARE_DATASET_TASK,
    props,
    cleanUpTask,
  );

  const runInferenceTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.RUN_INFERENCE_TASK,
    props,
    cleanUpTask,
  );

  const orchestrateMetricsComputationTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.ORCHESTRATE_METRICS_COMPUTATION_TASK,
    props,
    cleanUpTask,
  );

  const prepareAutomatedEvaluationTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.PREPARE_AUTOMATED_EVALUATION_TASK,
    props,
    cleanUpTask,
  );

  const prepareHumanEvaluationTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.PREPARE_HUMAN_EVALUATION_TASK,
    props,
    cleanUpTask,
  );

  const postProcessOutputTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.POST_PROCESS_OUTPUT_TASK,
    props,
    cleanUpTask,
  );

  const invokePrepareDatasetTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.INVOKE_PREPARE_DATASET_TASK,
    props,
    cleanUpTask,
  );

  const invokePostProcessOutputTask = getModelEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    StepFunctionStates.INVOKE_POST_PROCESS_OUTPUT_TASK,
    props,
    cleanUpTask,
  );

  const hasVpcConfigCondition = Condition.booleanEquals('$.hasVpcConfig', true);

  const withCustomerVPCAfterEvalChain = invokePostProcessOutputTask.next(cleanUpTask);
  const withoutCustomerVPCAfterEvalChain = postProcessOutputTask.next(cleanUpTask);

  const vpcConfigAfterEvalChain = new Choice(scope, 'hasVPCConfigAfterEval?')
    .when(hasVpcConfigCondition, withCustomerVPCAfterEvalChain)
    .otherwise(withoutCustomerVPCAfterEvalChain);

  const shouldSkipInference = Condition.and(
    Condition.isPresent('$.shouldSkipInference'),
    Condition.booleanEquals('$.shouldSkipInference', true),
  );

  const hasEvaluatorModelConfig = Condition.and(
    Condition.isPresent('$.hasEvaluatorModelConfig'),
    Condition.booleanEquals('$.hasEvaluatorModelConfig', true),
  );
  const automatedScoringChain = new Choice(scope, 'hasEvaluatorModelConfig?')
    .when(hasEvaluatorModelConfig, orchestrateMetricsComputationTask.next(vpcConfigAfterEvalChain))
    .otherwise(prepareAutomatedEvaluationTask.next(vpcConfigAfterEvalChain));

  const humanEvaluationScoringChain = prepareHumanEvaluationTask.next(vpcConfigAfterEvalChain);

  const scoringConditional = new Choice(scope, modelEvaluationScoringConditionalIdentifier);
  const scoringChain = scoringConditional
    .when(Condition.stringEquals('$.jobType', 'Automated'), automatedScoringChain)
    .otherwise(humanEvaluationScoringChain);

  const inferenceChain = new Choice(scope, 'shouldSkipInference?')
    .when(shouldSkipInference, scoringChain)
    .otherwise(runInferenceTask.next(scoringChain));

  const withCustomerVPCBeforeEvalChain = invokePrepareDatasetTask.next(inferenceChain);
  const withoutCustomerVPCBeforeEvalChain = prepareDatasetTask.next(inferenceChain);

  const vpcConfigBeforeEvalChain = new Choice(scope, 'hasVPCConfigBeforeEval?')
    .when(hasVpcConfigCondition, withCustomerVPCBeforeEvalChain)
    .otherwise(withoutCustomerVPCBeforeEvalChain);

  const name = `AmazonBedrockEvaluationServiceAsyncWorkflowStateMachine-${props.stageType}`;
  return new StateMachine(scope, name, {
    stateMachineName: name,
    definitionBody: DefinitionBody.fromChainable(vpcConfigBeforeEvalChain),
    tracingEnabled: true,
  });
}

// This method will call another function that would create an ecs run task for a particular step
// in the step function. Note: Each state in the step function will be an ecs instance of its own.
export function getModelEvaluationState(
  scope: Construct,
  ecsClusterStack: EcsClusterStack,
  ecsServiceStack: EcsServiceStack,
  stateName: StepFunctionStates,
  props: StepFunctionStackProps,
  catchState?: EcsRunTask | Pass,
) {
  // Override States.TaskFailed retry to catch ECS related errors for inconsequential tasks
  // specifically not InferenceTask since we are charging customers
  const propsWithBroadECSRetry = {
    ...props,
    retryProps: [
      {
        errors: ['ECS.ServerException', 'States.TaskFailed'],
        interval: Duration.seconds(5),
        maxAttempts: 3,
      },
      {
        // Capacity issue, retry as much as possible with longer initial delay.
        errors: ['ECS.AmazonECSException'],
        interval: Duration.minutes(1),
        maxDelay: Duration.minutes(2),
        maxAttempts: 10,
        jitterStrategy: JitterType.FULL,
      },
    ],
  };

  switch (stateName) {
    case StepFunctionStates.RUN_INFERENCE_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(12)),
        props,
        catchState,
      );
    case StepFunctionStates.PREPARE_DATASET_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(1)),
        propsWithBroadECSRetry,
        catchState,
      );
    case StepFunctionStates.POST_PROCESS_OUTPUT_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(1)),
        props,
        catchState,
      );
    case StepFunctionStates.INVOKE_PREPARE_DATASET_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        true,
        Timeout.duration(Duration.hours(1)),
        props,
        catchState,
      );
    case StepFunctionStates.INVOKE_POST_PROCESS_OUTPUT_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        true,
        Timeout.duration(Duration.hours(1)),
        props,
        catchState,
      );
    case StepFunctionStates.CLEANUP_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(1)),
        props,
      );
    case StepFunctionStates.ORCHESTRATE_METRICS_COMPUTATION_TASK:
    case StepFunctionStates.PREPARE_AUTOMATED_EVALUATION_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        true,
        Timeout.duration(Duration.days(1)),
        props,
        catchState,
      );
    case StepFunctionStates.PREPARE_HUMAN_EVALUATION_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        true,
        Timeout.duration(Duration.days(30)),
        props,
        catchState,
      );
    default:
      return new Pass(scope, 'Passing State Machine');
  }
}

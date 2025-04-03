import { Construct } from 'constructs';
import { EcsClusterStack } from '../../fargate-service/ecsClusterStack';
import { EcsServiceStack } from '../../fargate-service/ecsServiceStack';
import { StepFunctionStackProps } from '../stepFunctionStack';
import { Choice, Condition, DefinitionBody, Pass, StateMachine, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { createEcsStateForStepFunction } from '../utils';
import { RAGStepFunctionStates, StepFunctionStates } from '../../enums/stepFunctionStates';
import { EcsRunTask } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Duration } from 'aws-cdk-lib';
import { ragEvaluationScoringConditionalIdentifier } from '../../constants/stepFunctionConstants';
import { getKnowledgeBaseEvaluationArtifactsBucket } from '../../constants/constants';
import { StageType } from '@amzn/amazon-bedrock-evaluation-constructs';

export function createRagEvaluationWorkflow(
  scope: Construct,
  ecsClusterStack: EcsClusterStack,
  ecsServiceStack: EcsServiceStack,
  props: StepFunctionStackProps,
): StateMachine {
  let knowledgeBaseRuntimeAccount = '';
  let knowledgeBaseEvaluationArtifactsBucket = '';
  if (props.stageType === StageType.Beta || props.stageType === StageType.Dev) {
    knowledgeBaseRuntimeAccount = '556304931934';
    knowledgeBaseEvaluationArtifactsBucket = getKnowledgeBaseEvaluationArtifactsBucket(
      StageType.Gamma,
      'us-east-1',
      knowledgeBaseRuntimeAccount,
    );
  } else {
    knowledgeBaseRuntimeAccount = props.kbAccountId;
    knowledgeBaseEvaluationArtifactsBucket = getKnowledgeBaseEvaluationArtifactsBucket(
      props.stageType,
      props.region.toLowerCase(),
      props.kbAccountId,
    );
  }

  const cleanUpTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.CLEANUP_RAG_TASK,
    props,
  );

  const prepareDatasetTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.PREPARE_RAG_DATASET_TASK,
    props,
    cleanUpTask,
  );

  const runInferenceTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.RUN_RAG_INFERENCE_TASK,
    props,
    cleanUpTask,
    knowledgeBaseRuntimeAccount,
    knowledgeBaseEvaluationArtifactsBucket,
  );

  const prepareAutomatedEvaluationTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.PREPARE_RAG_AUTOMATED_EVALUATION_TASK,
    props,
    cleanUpTask,
  );

  const prepareHumanEvaluationTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.PREPARE_RAG_HUMAN_EVALUATION_TASK,
    props,
    cleanUpTask,
  );

  const postProcessOutputTask = getRagEvaluationState(
    scope,
    ecsClusterStack,
    ecsServiceStack,
    RAGStepFunctionStates.POST_PROCESS_RAG_OUTPUT_TASK,
    props,
    cleanUpTask,
  );

  const automatedScoringChain = prepareAutomatedEvaluationTask.next(postProcessOutputTask).next(cleanUpTask);
  const humanEvaluationScoringChain = prepareHumanEvaluationTask.next(postProcessOutputTask);

  const scoringConditional = new Choice(scope, ragEvaluationScoringConditionalIdentifier);
  const scoringChain = scoringConditional
    .when(Condition.stringEquals('$.jobType', 'Automated'), automatedScoringChain)
    .otherwise(humanEvaluationScoringChain);

  const shouldSkipInference = Condition.and(
    Condition.isPresent('$.shouldSkipInference'),
    Condition.booleanEquals('$.shouldSkipInference', true),
  );

  const inferenceChain = new Choice(scope, 'shouldSkipRagInference?')
    .when(shouldSkipInference, scoringChain)
    .otherwise(runInferenceTask.next(scoringChain));
  const startChain = prepareDatasetTask.next(inferenceChain);

  const name = `AmazonBedrockEvaluationServiceRagEvaluationWorkflowStateMachine-${props.stageType}`;
  return new StateMachine(scope, name, {
    stateMachineName: name,
    definitionBody: DefinitionBody.fromChainable(startChain),
    tracingEnabled: true,
  });
}

// This method will call another function that would create an ecs run task for a particular step
// in the step function. Note: Each state in the step function will be an ecs instance of its own.
export function getRagEvaluationState(
  scope: Construct,
  ecsClusterStack: EcsClusterStack,
  ecsServiceStack: EcsServiceStack,
  stateName: RAGStepFunctionStates,
  props: StepFunctionStackProps,
  catchState?: EcsRunTask | Pass,
  knowledgeBaseRuntimeAccount?: string,
  knowledgeBaseEvaluationArtifactsBucket?: string,
) {
  switch (stateName) {
    case RAGStepFunctionStates.RUN_RAG_INFERENCE_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(12)),
        props,
        catchState,
        knowledgeBaseRuntimeAccount,
        knowledgeBaseEvaluationArtifactsBucket,
      );
    case RAGStepFunctionStates.PREPARE_RAG_DATASET_TASK:
    case RAGStepFunctionStates.POST_PROCESS_RAG_OUTPUT_TASK:
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
    case RAGStepFunctionStates.CLEANUP_RAG_TASK:
      return createEcsStateForStepFunction(
        scope,
        ecsClusterStack,
        ecsServiceStack,
        stateName,
        false,
        Timeout.duration(Duration.hours(1)),
        props,
      );
    case RAGStepFunctionStates.PREPARE_RAG_AUTOMATED_EVALUATION_TASK:
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
    case RAGStepFunctionStates.PREPARE_RAG_HUMAN_EVALUATION_TASK:
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

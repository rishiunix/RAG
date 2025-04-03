import { Construct } from 'constructs';
import { EcsClusterStack } from '../fargate-service/ecsClusterStack';
import { EcsServiceStack } from '../fargate-service/ecsServiceStack';
import { AgentStepFunctionStates, RAGStepFunctionStates, StepFunctionStates } from '../enums/stepFunctionStates';
import { EcsFargateLaunchTarget, EcsRunTask } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { IntegrationPattern, JsonPath, Pass, Timeout } from 'aws-cdk-lib/aws-stepfunctions';
import { PropagatedTagSource } from 'aws-cdk-lib/aws-ecs';
import { StepFunctionStackProps } from './stepFunctionStack';

export function createEcsStateForStepFunction(
  scope: Construct,
  ecsClusterStack: EcsClusterStack,
  ecsServiceStack: EcsServiceStack,
  stateName: StepFunctionStates | RAGStepFunctionStates | AgentStepFunctionStates,
  waitForTaskToken: boolean,
  stepTimeout: Timeout,
  props: StepFunctionStackProps,
  catchState?: EcsRunTask | Pass,
  knowledgeBaseRuntimeAccount?: string,
  knowledgeBaseEvaluationArtifactsBucket?: string,
) {
  const containerEnv = [
    {
      name: 'TASK_INPUT',
      value: JsonPath.stringAt('$.taskInput'),
    },
    {
      name: 'TASK_NAME',
      value: stateName,
    },
    {
      name: 'MODEL_METADATA_MAP',
      value: JsonPath.stringAt('$.bedrockModelMetadataMap'),
    },
    {
      name: 'SERVICE_ACCOUNT_ID',
      value: props.serviceAccountId,
    },
    {
      name: 'AIRPORT_CODE',
      value: props.airportCode,
    },
    {
      name: 'ARN_PARTITION',
      value: props.arnPartition,
    },
  ];

  if (!catchState) {
    containerEnv.push({
      name: 'ERROR',
      value: JsonPath.jsonToString(JsonPath.objectAt('$.error.Error')),
    });
  }

  if (waitForTaskToken) {
    containerEnv.push({
      name: 'TASK_TOKEN',
      value: JsonPath.taskToken,
    });
  }

  if (
    stateName === StepFunctionStates.INVOKE_PREPARE_DATASET_TASK ||
    stateName === StepFunctionStates.INVOKE_POST_PROCESS_OUTPUT_TASK
  ) {
    containerEnv.push(
      {
        name: 'IMAGE_URI',
        value: ecsServiceStack.imageUri,
      },
      {
        name: 'EXECUTION_ROLE_ARN',
        value: ecsServiceStack.multiEniTaskExecutionRole,
      },
      {
        name: 'LOG_GROUP_NAME',
        value: ecsServiceStack.logGroup.logGroupName,
      },
      {
        name: 'MULTI_ENI_CREDENTIAL_ROLE',
        value: ecsServiceStack.multiEniCredentialRole.roleArn,
      },
      {
        name: 'SERVICE_SUBNETS',
        value: ecsClusterStack.cluster.vpc.privateSubnets.map((i) => i.subnetId).join(','),
      },
      {
        name: `SERVICE_SECURITY_GROUPS`,
        value: ecsServiceStack.securityGroup.securityGroupId,
      },
    );
  }

  if (knowledgeBaseRuntimeAccount) {
    containerEnv.push({
      name: 'KNOWLEDGE_BASE_RUNTIME_SERVICE_ACCOUNT_ID',
      value: knowledgeBaseRuntimeAccount,
    });
  }
  if (knowledgeBaseEvaluationArtifactsBucket) {
    containerEnv.push({
      name: 'KNOWLEDGE_BASE_EVALUATION_ARTIFACTS_BUCKET',
      value: knowledgeBaseEvaluationArtifactsBucket,
    });
  }

  const runTask = new EcsRunTask(scope, `${stateName}`, {
    integrationPattern: waitForTaskToken ? IntegrationPattern.WAIT_FOR_TASK_TOKEN : IntegrationPattern.RUN_JOB,
    resultPath: JsonPath.stringAt(`$.result`),
    cluster: ecsClusterStack.cluster,
    taskDefinition: ecsServiceStack.taskDefinition,
    launchTarget: new EcsFargateLaunchTarget(),
    propagatedTagSource: PropagatedTagSource.TASK_DEFINITION,
    taskTimeout: stepTimeout,
    containerOverrides: [
      {
        containerDefinition: ecsServiceStack.container,
        environment: containerEnv,
      },
    ],
  });
  props.retryProps?.forEach((retryProp) => {
    runTask.addRetry(retryProp);
  });
  runTask.addRetry(props.nonRetryProps);
  if (catchState) {
    runTask.addCatch(catchState, props.catchProps);
  }
  return runTask;
}

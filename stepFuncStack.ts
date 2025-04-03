import { NestedStack } from 'aws-cdk-lib';
import { Effect, Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { CatchProps, IChainable, RetryProps, StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Construct } from 'constructs';
import { DynamoDBStack } from '../dynamoDB/dynamoDBStack';
import { EcsClusterStack } from '../fargate-service/ecsClusterStack';
import { EcsServiceStack } from '../fargate-service/ecsServiceStack';
import { StageType } from '@amzn/amazon-bedrock-evaluation-constructs';
import { createModelEvaluationWorkflow } from './stateMachines/modelEvaluationStateMachine';
import { createRagEvaluationWorkflow } from './stateMachines/ragEvaluationStateMachine';
import { createAgentEvaluationWorkflow } from './stateMachines/agentEvaluationStateMachine';

export interface StepFunctionStackProps {
  readonly stageType: StageType;
  readonly serviceAccountId: string;
  readonly region: string;
  readonly arnPartition: string;
  readonly airportCode: string;
  readonly kbAccountId: string;
  readonly retryProps?: RetryProps[];
  readonly nonRetryProps?: RetryProps;
  readonly catchState?: IChainable; //EcsStateProps
  readonly catchProps?: CatchProps; //EcsStateProps
}

export class StepFunctionStack extends NestedStack {
  public modelEvaluationStateMachine: StateMachine;
  public ragEvaluationStateMachine: StateMachine;
  public agentEvaluationStateMachine: StateMachine;

  constructor(
    scope: Construct,
    id: string,
    readonly props: StepFunctionStackProps,
    ecsClusterStack: EcsClusterStack,
    ecsServiceStack: EcsServiceStack,
  ) {
    super(scope, id);

    // Creating the step function workflows
    this.modelEvaluationStateMachine = createModelEvaluationWorkflow(this, ecsClusterStack, ecsServiceStack, props);
    this.ragEvaluationStateMachine = createRagEvaluationWorkflow(this, ecsClusterStack, ecsServiceStack, props);
    this.agentEvaluationStateMachine = createAgentEvaluationWorkflow(this, ecsClusterStack, ecsServiceStack, props);

    const stateMachines: StateMachine[] = [
      this.modelEvaluationStateMachine,
      this.ragEvaluationStateMachine,
      this.agentEvaluationStateMachine,
    ];
    const runEcsTaskPolicy: Policy = this.createInlinePolicyForRunEcsTask(
      `arn:${props.arnPartition}:ecs:` +
        this.props.region +
        ':' +
        this.props.serviceAccountId +
        ':task-definition/*AmazonBedrockEvaluationControlPlaneLambdaEcsService*TaskDefinition*:*',
    );
    stateMachines.forEach((stateMachine) => {
      // we need to grant permission to state machine to start the ecs service
      ecsServiceStack.taskDefinition.grantRun(stateMachine);

      // had to do this hacky construction of the unversioned task definition arn because of this issue https://t.corp.amazon.com/P133887855
      stateMachine.role.attachInlinePolicy(runEcsTaskPolicy);
    });
  }

  // Creating an inline policy to allow the step functions to run the ECS tasks. There has been some behaviour we have
  // observed where `ecs:RunTask` permisions setup on `taskDefinitionArn` resource still does not able the Sfn to trigger the task
  // because the `taskDefinitionArn` contains a  version number that looks like `:*`. Since this policy is defined within the `EcsRunTask`
  // we need to create a new policy to setup the proper permission to allow `ecs:RunTask` permission to run all task definition versions.
  createInlinePolicyForRunEcsTask(taskDefinitionArn: string): Policy {
    return new Policy(this, `EcsRunTaskPreviousVersionPolicy`, {
      policyName: 'EcsRunTaskPreviousVersionPolicy',
      statements: [
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['ecs:RunTask'],
          resources: [taskDefinitionArn],
        }),
      ],
    });
  }
}

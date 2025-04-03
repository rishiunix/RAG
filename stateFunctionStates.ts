export enum StepFunctionStates {
  PREPARE_DATASET_TASK = 'PrepareDatasetTask',
  RUN_INFERENCE_TASK = 'RunInferenceTask',
  PREPARE_AUTOMATED_EVALUATION_TASK = 'PrepareAutomatedEvaluationTask',
  PREPARE_HUMAN_EVALUATION_TASK = 'PrepareHumanEvaluationTask',
  ORCHESTRATE_METRICS_COMPUTATION_TASK = 'OrchestrateMetricsComputationTask',
  POST_PROCESS_OUTPUT_TASK = 'PostProcessOutputTask',
  CLEANUP_TASK = 'CleanUpTask',
  INVOKE_PREPARE_DATASET_TASK = 'InvokePrepareDatasetTask',
  INVOKE_POST_PROCESS_OUTPUT_TASK = 'InvokePostProcessOutputTask',
}

export enum RAGStepFunctionStates {
  PREPARE_RAG_DATASET_TASK = 'PrepareRAGDatasetTask',
  RUN_RAG_INFERENCE_TASK = 'RunRAGInferenceTask',
  PREPARE_RAG_AUTOMATED_EVALUATION_TASK = 'PrepareRAGAutomatedEvaluationTask',
  PREPARE_RAG_HUMAN_EVALUATION_TASK = 'PrepareRAGHumanEvaluationTask',
  POST_PROCESS_RAG_OUTPUT_TASK = 'PostProcessRAGOutputTask',
  CLEANUP_RAG_TASK = 'CleanUpRAGTask',
}

export enum AgentStepFunctionStates {
  PREPARE_AGENT_DATASET_TASK = 'PrepareAgentDatasetTask',
}

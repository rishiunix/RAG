package com.amazon.bedrock.evaluation.controlplane.stepfunctions.utils;

import com.google.common.collect.ImmutableList;
import com.google.common.collect.ImmutableSet;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Constants {
    public static final String SERVICE_NAME = "DynamoDBEventProcessingLambda";
    public static final String METRICS_FACTORY = "METRICS_FACTORY";
    public static final String EVALUATION_JOB_METADATA_TABLE_NAME = "EvaluationJobMetadata";
    public static final String HYPHEN = "-";
    public static final String COLON = ":";
    public static final String FORWARD_SLASH = "/";
    public static final long SFN_CLIENT_API_CALL_ATTEMPT_TIMEOUT = 2000;
    public static final long SFN_CLIENT_API_CALL_TIMEOUT = 28000;
    public static final int SFN_CLIENT_API_CALL_MAX_RETRY = 5;
    public static final Duration SFN_CLIENT_API_RETRY_BASE_DELAY = Duration.ofMillis(500L);
    public static final String TITAN_MODEL_PREFIX = "amazon";
    public static final String META_MODEL_PREFIX = "meta";
    public static final String ANTHROPIC_MODEL_PREFIX = "anthropic";
    public static final String COHERE_MODEL_PREFIX = "cohere";
    public static final String AI21_MODEL_PREFIX = "ai21";
    public static final String MISTRAL_MODEL_PREFIX = "mistral";
    public static final String LLAMA_MODEL_ARCHITECTURE = "llama";
    public static final String AI21_JURASSIC_MODEL_PREFIX = "ai21.j2";
    public static final String AI21_JAMBA_MODEL_PREFIX = "ai21.jamba";
    public static final String S3_URI_PREFIX = "s3://";
    public static final String SERVICE_DATA_BUCKET_NAME_FORMAT = "evaluation-data-bedrock-%s-%s-%s";
    public static final String TITAN_TEXT_GENERATION_CONFIG_KEY = "textGenerationConfig";
    public static final String SCALE = "scale";
    public static final String APPLY_TO_WHITESPACES = "applyToWhitespaces";
    public static final String APPLY_TO_PUNCTUATIONS = "applyToPunctuations";
    public static final String APPLY_TO_NUMBERS = "applyToNumbers";
    public static final String APPLY_TO_STOPWORDS = "applyToStopwords";
    public static final String APPLY_TO_EMOJIS = "applyToEmojis";
    public static final String COMMERCIAL_AWS_PARTITION = "aws";
    public static final String CONVERSE_INFERENCE_PARAM_CONFIG_KEY = "inferenceConfig";
    public static final String CONVERSE_INFERENCE_PARAM_ADDITIONAL_FIELDS_KEY = "additionalModelRequestFields";

    // Model Evaluation Tasks
    public static final String RUN_INFERENCE_TASK = "RunInferenceTask";
    public static final String CLEANUP_TASK = "CleanUpTask";
    public static final String ORCHESTRATE_METRICS_COMPUTATION_TASK = "OrchestrateMetricsComputationTask";
    public static final String POST_PROCESS_OUTPUT_TASK = "PostProcessOutputTask";
    public static final String POST_PROCESS_OUTPUT_SERVICE_TASK = "PostProcessOutputServiceTask";
    public static final String POST_PROCESS_OUTPUT_CUSTOMER_TASK = "PostProcessOutputCustomerTask";
    public static final String POST_PROCESS_OUTPUT_FINALIZE_TASK = "PostProcessOutputFinalizeTask";
    public static final String PREPARE_AUTOMATED_EVALUATION_TASK = "PrepareAutomatedEvaluationTask";
    public static final String PREPARE_HUMAN_EVALUATION_TASK = "PrepareHumanEvaluationTask";
    public static final String PREPARE_DATASET_TASK = "PrepareDatasetTask";
    public static final String PREPARE_DATASET_CUSTOMER_TASK = "PrepareDatasetCustomerTask";
    public static final String PREPARE_DATASET_SERVICE_TASK = "PrepareDatasetServiceTask";
    public static final String INVOKE_POST_PROCESS_OUTPUT_TASK = "InvokePostProcessOutputTask";
    public static final String INVOKE_PREPARE_DATASET_TASK = "InvokePrepareDatasetTask";
    public static final String MISTRAL_LARGE_2402_V0_1_MODEL_ID = "mistral.mistral-large-2402-v1:0";
    public static final String MISTRAL_SMALL_2402_V0_1_MODEL_ID = "mistral.mistral-small-2402-v1:0";
    public static final String MISTRAL_LARGE_2407_V1_0_MODEL_ID = "mistral.mistral-large-2407-v1:0";

    // RAG Evaluation Tasks
    public static final String PREPARE_RAG_DATASET_TASK = "PrepareRAGDatasetTask";
    public static final String RUN_RAG_INFERENCE_TASK = "RunRAGInferenceTask";
    public static final String PREPARE_RAG_AUTOMATED_EVALUATION_TASK = "PrepareRAGAutomatedEvaluationTask";
    public static final String PREPARE_RAG_HUMAN_EVALUATION_TASK = "PrepareRAGHumanEvaluationTask";
    public static final String POST_PROCESS_RAG_OUTPUT_TASK = "PostProcessRAGOutputTask";
    public static final String CLEANUP_RAG_TASK = "CleanUpRAGTask";

    /**
     * Sagemaker Human Eval flow will call AmazonBedrockEvaluationCredentialsLambda to fetch temporary customer credential
     * Ref: <a href="https://tiny.amazon.com/po7g5mr7">Link</a>
     */
    public static final String HUMAN_EVAL_CREDENTIAL_TOKEN_FORMAT = "accountId:%s;jobArn:%s";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/taskTypes/<TASK_TYPE>/datasets/<DATASET_NAME>/data.jsonl
     */
    public static final String DATASET_S3_PATH = "%s/%s/taskTypes/%s/datasets/%s/data.jsonl";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/inference_inputs/models/<MODEL_IDENTIFIER>/taskTypes/<TASK_TYPE>/datasets/<DATASET_NAME>/data.jsonl
     */
    public static final String MODEL_INPUTS_S3_PATH =
            "%s/%s/inference_inputs/models/%s/taskTypes/%s/datasets/%s/data.jsonl";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/inference_outputs/models/<MODEL_IDENTIFIER>/taskTypes/<TASK_TYPE>/datasets/<DATASET_NAME>/data.jsonl
     */
    public static final String MODEL_OUTPUTS_S3_PATH =
            "%s/%s/inference_outputs/models/%s/taskTypes/%s/datasets/%s/data.jsonl";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/automated_scoring_inputs/models/<MODEL_IDENTIFIER>/taskTypes/<TASK_TYPE>/datasets/
     * <DATASET_NAME>/scoring_input.jsonl
     */
    public static final String SCORING_INPUT_S3_PATH =
            "%s/%s/automated_scoring_inputs/models/%s/taskTypes/%s/datasets/" + "%s/scoring_input.jsonl";

    public static final String EVAL_CONFIG_S3_PATH = "%s/%s/automated_scoring_inputs/models/%s/eval_config.json";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/automated_scoring_outputs/models/<MODEL_IDENTIFIER>/
     */
    public static final String SCORING_OUTPUT_S3_PATH = "%s/%s/automated_scoring_outputs/models/%s/";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/human_evaluation_inputs/datasets/<DATASET_NAME>/scoring_input.jsonl
     */
    public static final String HUMAN_EVALUATION_SCORING_INPUT_S3_PATH =
            "%s/%s/human_evaluation_inputs/datasets/%s/scoring_input.jsonl";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/human_evaluation_outputs/<job-name>/<job-id>/datasets/<dataset-name>/output.jsonl
     */
    public static final String HUMAN_EVALUATION_SCORING_OUTPUT_S3_PATH =
            "%s/%s/human_evaluation_outputs/<job-name>/<job-id>/datasets/%s/output.jsonl";

    /**
     * <BUCKET_NAME>/<ACCOUNT_ID>/<EVALUATION_ID>/human_evaluation_inputs/datasets/<DATASET_NAME>/scoring_input.jsonl
     */
    public static final String INPUT_DATA_CONFIG_FOR_HUMAN_EVAL_S3_URI_PATH =
            "s3://%s/%s/%s/human_evaluation_inputs/datasets/%s/scoring_input.jsonl";

    /**
     * <BUCKET_NAME>/<ACCOUNT_ID>/<EVALUATION_ID>/human_evaluation_outputs
     */
    public static final String OUTPUT_DATA_CONFIG_FOR_HUMAN_EVAL_S3_URI_PATH = "s3://%s/%s/%s/human_evaluation_outputs";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/automated_scoring_outputs/models/<MODEL_IDENTIFIER>/<ALGORITHM>_<DATASET_NAME>.jsonl
     */
    public static final String AUTOMATIC_SCORING_OUTPUT_S3_PATH =
            "%s/%s/automated_scoring_outputs/models/%s/%s_%s.jsonl";

    /**
     * <ACCOUNT_ID>/<EVALUATION_ID>/human_evaluation_outputs/<job-name>/<job-id>/datasets/<dataset-name>/output.jsonl.jsonl
     */
    public static final String HUMAN_SCORING_OUTPUT_S3_PATH =
            "%s/%s/human_evaluation_outputs/%s/%s/datasets/%s/output.jsonl";

    /**
     * <OUTPUT_PATH>/<JOB_NAME>/<EVALUATION_ID>/models/<MODEL_NAME>/taskTypes/<TASK_TYPE>/datasets/<DATASET_NAME>/<UUID>_output.jsonl
     */
    public static final String AUTOMATED_EVAL_RESULT_S3_PATH =
            "%s/%s/%s/models/%s/taskTypes/%s/datasets/%s/%s_output.jsonl";

    /**
     * <JOB_NAME>/<EVALUATION_ID>/models/<MODEL_NAME>/taskTypes/<TASK_TYPE>/datasets/<DATASET_NAME>/<UUID>_output.jsonl
     */
    // Use this Path if the customer provides a bucket name without a key in the output URI
    public static final String AUTOMATED_EVAL_RESULT_S3_PATH_NO_KEY =
            "%s/%s/models/%s/taskTypes/%s/datasets/%s/%s_output.jsonl";

    /**
     * s3://<customer-provided-path>/<job_name>/<job_uuid>/datasets/<dataset-name>/<UUID>_output.jsonl
     */
    public static final String HUMAN_EVAL_RESULT_S3_PATH = "%s/%s/%s/datasets/%s/%s_output.jsonl";

    /**
     * s3://<customer-provided-bucket>/<job_name>/<job_uuid>/datasets/<dataset-name>/<UUID>_output.jsonl
     */
    // Use this Path if the customer provides a bucket name without a key in the output URI
    public static final String HUMAN_EVAL_RESULT_S3_PATH_NO_KEY = "%s/%s/datasets/%s/%s_output.jsonl";
    // The role contains permission required to perform SM API calls like createEvaluationJob, describeEvaluationJob
    public static final String SAGEMAKER_HUMAN_EVALUATION_PROCESSING_JOB_IAM_ROLE_NAME =
            "smHumanEvaluationProcessingJobIAMRole";
    // Role passed to Sagemaker to perform human evaluation work
    public static final String SAGEMAKER_SERVICE_EXECUTION_IAM_ROLE_NAME = "sagemakerServiceExecutionIAMRole";
    public static final String RESULT_S3_PATH = "%s/%s/models/%s/datasets/%s/output.jsonl";
    public static final String EVALUATION_IDENTIFIER_MDC_KEY = "EvaluationIdentifier";
    public static final String HEADER_SOURCE_ACCOUNT = "x-amz-source-account";
    public static final String HEADER_SOURCE_ARN = "x-amz-source-arn";

    // Metrics
    public static final String METHOD_NAME_METRIC_PROP_KEY = "MethodName";

    // Inference Parameters
    public static final List<String> SUPPORTED_TOP_P_CONFIG = ImmutableList.of(
            "topP", // Titan, ai21,
            "top_p", // Meta, Anthropic, Mistral
            "p" // Cohere
            );
    public static final List<String> SUPPORTED_MAX_TOKENS_CONFIG = ImmutableList.of(
            "maxTokens", // ai21
            "maxTokenCount", // Titan
            "max_tokens_to_sample", // Anthropic
            "max_tokens", // Cohere, Mistral
            "max_gen_len" // Meta
            );
    public static final List<String> SUPPORTED_TEMPERATURE_CONFIG = ImmutableList.of(
            "temperature" // All models
            );
    // Meta models don't support stop sequences in the API
    public static final List<String> SUPPORTED_STOP_SEQUENCES_CONFIG = ImmutableList.of(
            "stopSequences", // ai21, Titan,
            "stop_sequences", // Anthropic, Cohere
            "stop" // Mistral
            );
    public static final Set<String> SUPPORTED_CMI_MODEL_ARCHITECTURE = ImmutableSet.of("mistral", "llama");
    public static final Set<String> SUPPORTED_BASE_INFERENCE_PARAMS = Stream.of(
                    SUPPORTED_TOP_P_CONFIG,
                    SUPPORTED_MAX_TOKENS_CONFIG,
                    SUPPORTED_TEMPERATURE_CONFIG,
                    SUPPORTED_STOP_SEQUENCES_CONFIG)
            .flatMap(List::stream)
            .collect(Collectors.toUnmodifiableSet());
    public static final String MODEL_ID_REGEX = "[a-z0-9-]{1,63}[.]{1}[a-z0-9-]{1,63}([.:]?[a-z0-9-]{1,63})";
    public static final String BUILT_IN_INFERENCE_PROFILE_ID_PREFIX = "^[a-z-]{2,8}\\.";
    public static final String BUILT_IN_INFERENCE_PROFILE_ID_REGEX =
            BUILT_IN_INFERENCE_PROFILE_ID_PREFIX + MODEL_ID_REGEX;
    public static final String BUILT_IN_INFERENCE_PROFILE_ARN_PREFIX =
            "^arn:aws(-[^:]+)?:bedrock:[a-z0-9-]{1,20}:" + "[0-9]{12}:inference-profile\\/[a-z-]{2,8}\\.";
    public static final String APPLICATION_INFERENCE_PROFILE_ID_REGEX = "[a-z0-9]{12}";
    public static final String APPLICATION_INFERENCE_PROFILE_RESOURCE_TYPE = "application-inference-profile";
    public static final String BUILTIN_INFERENCE_PROFILE_RESOURCE_TYPE = "inference-profile";
    public static final String CUSTOM_MODEL_ARN_PREFIX =
            "^arn:aws(-[^:]+)?:bedrock:[a-z0-9-]{1,20}:" + "[0-9]{12}:custom-model\\/";
    public static final String PROVISIONED_MODEL_ARN_PREFIX =
            "^arn:aws(-[^:]+)?:bedrock:[a-z0-9-]{1,20}:" + "[0-9]{12}:provisioned-model\\/";
    public static final String MODEL_GATEWAY_ARN_IDENTIFIER = "model-gateway";
    public static final String PROVISIONED_MODEL_RESOURCE_ID = "provisioned-model";
    public static final String IMPORTED_MODEL_RESOURCE_ID = "imported-model";
    public static final String MARKETPLACE_MODEL_RESOURCE_ID = "endpoint";
    public static final String FOUNDATION_MODEL_RESOURCE_ID = "foundation-model";
    public static final String DEFAULT_PROMPT_ROUTER_RESOURCE_TYPE = "default-prompt-router";
    public static final String CUSTOM_PROMPT_ROUTER_RESOURCE_TYPE = "prompt-router";
    public static final String CMI_PREFIX = "cmi-";
    public static final String MARKETPLACE_MODEL_METRICS_IDENTIFIER = "marketplace-model";
}

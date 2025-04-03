package com.amazon.bedrock.evaluation.controlplane.stepfunctions.controller;

import static com.amazon.bedrock.evaluation.controlplane.stepfunctions.utils.Constants.COLON;
import static com.amazon.bedrock.evaluation.controlplane.stepfunctions.utils.Constants.EVALUATION_JOB_METADATA_TABLE_NAME;
import static com.amazon.bedrock.evaluation.controlplane.stepfunctions.utils.Constants.FORWARD_SLASH;
import static com.amazon.bedrock.evaluation.controlplane.stepfunctions.utils.Constants.HYPHEN;

import com.amazon.bedrock.evaluation.controlplane.stepfunctions.processor.BaseStepFunctionEventProcessor;
import com.amazon.bedrock.evaluation.controlplane.stepfunctions.processor.EvaluationJobEventProcessor;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.google.common.base.Preconditions;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.inject.Inject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

public class StepFunctionsController {
    private static final Logger LOG = LogManager.getLogger(StepFunctionsController.class);
    private final Map<String, BaseStepFunctionEventProcessor> eventProcessorMap;
    private final EvaluationJobEventProcessor evaluationJobEventProcessor;

    @Inject
    public StepFunctionsController(final EvaluationJobEventProcessor evaluationJobEventProcessor) {
        this.evaluationJobEventProcessor = evaluationJobEventProcessor;
        this.eventProcessorMap = new HashMap<>() {
            {
                put(EVALUATION_JOB_METADATA_TABLE_NAME, evaluationJobEventProcessor);
            }
        };
    }

    public void handleEvents(List<DynamodbEvent.DynamodbStreamRecord> records) {
        LOG.info("Handling event in the controller");
        String tableName =
                getTableNameFromDDBStreamEventSourceARN(records.get(0).getEventSourceARN());
        LOG.info("Parsed table name: {} from ddb records", tableName);

        try {
            if (eventProcessorMap.containsKey(tableName)) {
                LOG.info("Executing event processor for table name: {} to process dynamodb events", tableName);
                eventProcessorMap.get(tableName).processEvents(records);
            }
        } catch (final Exception e) {
            final String errorMessage = String.format(
                    "Step function triggering failed with " + "exception: %s and cause: %s",
                    e.getClass().getCanonicalName(), e.getMessage());
            LOG.error(errorMessage, e);
            throw new RuntimeException(errorMessage, e);
        }
    }

    private String getTableNameFromDDBStreamEventSourceARN(final String eventSourceArn) {
        // sample ARN for our service: arn:aws:dynamodb:REGION:ACCOUNT:table/tableName-stage-airportCode
        Preconditions.checkNotNull(eventSourceArn, "Event Source Arn cannot be null.");
        final String[] arnParts = eventSourceArn.split(COLON);
        final String[] resourceParts = arnParts[5].split(FORWARD_SLASH);
        return resourceParts[1].split(HYPHEN)[0];
    }
}

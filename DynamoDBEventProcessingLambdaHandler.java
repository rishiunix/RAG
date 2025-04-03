package com.amazon.bedrock.evaluation.controlplane;

import com.amazon.bedrock.evaluation.controlplane.stepfunctions.controller.StepFunctionsController;
import com.amazon.bedrock.evaluation.dataaccess.utils.JacksonSerdesUtil;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import edu.umd.cs.findbugs.annotations.SuppressFBWarnings;
import javax.inject.Inject;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.SendMessageRequest;
import software.amazon.awssdk.services.sqs.model.SendMessageResponse;

public class DynamoDBEventProcessingLambdaHandler implements RequestHandler<DynamodbEvent, String> {
    private static final Logger LOG = LogManager.getLogger(DynamoDBEventProcessingLambdaHandler.class);

    private final StepFunctionsController stepFunctionsController;
    private final SqsClient sqsClient;
    private final String queueUrl;

    @Inject
    @SuppressFBWarnings(value = "EI_EXPOSE_REP2", justification = "This is injected by DI")
    public DynamoDBEventProcessingLambdaHandler(
            final StepFunctionsController stepFunctionsController, final SqsClient sqsClient, final String queueUrl) {
        this.stepFunctionsController = stepFunctionsController;
        this.sqsClient = sqsClient;
        this.queueUrl = queueUrl;
    }

    @Override
    public String handleRequest(final DynamodbEvent dynamodbEvent, final Context context) {
        if (!dynamodbEvent.getRecords().isEmpty()) {
            try {
                stepFunctionsController.handleEvents(dynamodbEvent.getRecords());
            } catch (final Exception e) {
                LOG.info("DDB Event processing failed due to {}, sending message to DLQ", e.getMessage());
                final String serializedDynamoDbEvent = JacksonSerdesUtil.toJsonString(dynamodbEvent);
                final SendMessageRequest sendMessageRequest = SendMessageRequest.builder()
                        .queueUrl(queueUrl)
                        .messageBody(serializedDynamoDbEvent)
                        .build();

                final SendMessageResponse response = sqsClient.sendMessage(sendMessageRequest);
                LOG.info("Message sent to DLQ with messageId: {}", response.messageId());
                // sqsClient.sendMessage failure will result in an Internal Service Exception
                // this will pause DDB Stream processing until message is deleted / processed / 24 hours (whichever
                // happens first)
            }
        }
        return "Processed DynamoDB stream records: "
                + dynamodbEvent.getRecords().size();
    }
}

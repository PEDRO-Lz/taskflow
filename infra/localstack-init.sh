#!/bin/sh
set -e

awslocal sns create-topic --name user-events

awslocal sqs create-queue --queue-name user-events-tasks-queue

TOPIC_ARN=$(awslocal sns list-topics --query "Topics[0].TopicArn" --output text)
QUEUE_ARN="arn:aws:sqs:us-east-1:000000000000:user-events-tasks-queue"

awslocal sns subscribe \
  --topic-arn "$TOPIC_ARN" \
  --protocol sqs \
  --notification-endpoint "$QUEUE_ARN"

echo "LocalStack: recursos AWS simulados criados (SNS, SQS)."

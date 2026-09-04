terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    sns = var.localstack_endpoint
    sqs = var.localstack_endpoint
  }
}

resource "aws_sns_topic" "user_events" {
  name = "user-events"
}

resource "aws_sqs_queue" "user_events_tasks_queue" {
  name = "user-events-tasks-queue"
}

resource "aws_sqs_queue_policy" "allow_sns_publish" {
  queue_url = aws_sqs_queue.user_events_tasks_queue.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.user_events_tasks_queue.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_sns_topic.user_events.arn }
      }
    }]
  })
}

resource "aws_sns_topic_subscription" "tasks_queue" {
  topic_arn = aws_sns_topic.user_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.user_events_tasks_queue.arn
}

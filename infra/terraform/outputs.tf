output "sns_topic_arn" {
  value = aws_sns_topic.user_events.arn
}

output "sqs_queue_url" {
  value = aws_sqs_queue.user_events_tasks_queue.id
}

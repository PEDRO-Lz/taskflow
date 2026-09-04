variable "localstack_endpoint" {
  description = "Endpoint do LocalStack. localhost quando o Terraform roda no host (fora do compose); o nome do serviço (localstack) quando roda dentro do docker-compose."
  type        = string
  default     = "http://localhost:4566"
}

#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "derrubando o compose (containers, rede e volumes)"
docker-compose down -v

docker rmi taskflow-auth-service taskflow-tasks-service 2>/dev/null || true

echo "buildando as imagens de auth-service e tasks-service"
docker-compose build auth-service tasks-service

echo "recriando o cluster kind"
kind delete cluster --name taskflow 2>/dev/null || true
kind create cluster --name taskflow

echo "carregando as imagens no cluster"
kind load docker-image taskflow-auth-service:latest taskflow-tasks-service:latest --name taskflow

echo "aplicando os manifests"
kubectl apply -f infra/k8s/

echo "aguardando postgres, redis e localstack ficarem prontos"
kubectl wait --for=condition=ready pod -l app=postgres-auth --timeout=90s
kubectl wait --for=condition=ready pod -l app=postgres-tasks --timeout=90s
kubectl wait --for=condition=ready pod -l app=redis --timeout=90s
kubectl wait --for=condition=ready pod -l app=localstack --timeout=90s

echo "aguardando auth-service e tasks-service (3 replicas cada)"
kubectl rollout status deployment/auth-service --timeout=120s
kubectl rollout status deployment/tasks-service --timeout=120s

echo
echo "taskflow-control-plane disponivel:"
docker ps --format 'table {{.Names}}\t{{.Status}}'

echo
echo "antes de testar, rode em dois terminais:"
echo "  kubectl port-forward svc/auth-service 3001:3001"
echo "  kubectl port-forward svc/tasks-service 3002:3002"

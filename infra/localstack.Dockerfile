FROM localstack/localstack:3

# Empacotar o script dentro da imagem (em vez de bind mount) garante permissão de execução
COPY localstack-init.sh /etc/localstack/init/ready.d/init.sh
RUN chmod +x /etc/localstack/init/ready.d/init.sh

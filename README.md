# Bots com Docker Compose

Este projeto utiliza o arquivo `docker-compose.yml` na raiz para subir os dois bots Node.js:

- `biblia_rapida_bot`
- `regra_de_3_bot`

## Como executar

Na pasta raiz do projeto, execute:

```bash
docker compose up -d
```

## Como parar

```bash
docker compose down
```

## Observações

- O arquivo `.env` da raiz é passado para cada container.
- O Compose espera que os diretórios dos projetos estejam disponíveis na mesma estrutura da pasta raiz.

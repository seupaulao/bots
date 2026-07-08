# Bots com Docker Compose

Este projeto utiliza o arquivo `docker-compose.yml` na raiz para subir os dois bots Node.js:

- `biblia_rapida_bot`
- `regra_de_3_bot`
- `atendimento_clinico_bot`

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

## Sobre

### BOTS

**atendimento clinico bot**

O intuito é criar um bot capaz de 
  - criar campanhas de atendimento
  - gerenciar consultas médicas
  - controlar anamnese simples por profissional da saude
  - controlar registro de profissionais da saude
  - controlar registro de pacientes
  - controlar registro de laudos e prescrições

**regra de 3**

- calcula a temperatura entre farenheit, kelvin e celsius
- calcula regra de 3 simples e composta

**biblia rapida bot**

- biblia livre em pt-BR
- leitura de verso
- leitura de capitulos
- dicionario de dados

**controle assinatura - bot**

- visualizar as aplicações que tem controle de assinatura
- controlar os usuário que tem assinatura em cada aplicação
  - controle de ocultar ou exibir propagandas
  - controle de bloquear ou desbloquear aplicação por falta de pagamento da assinatura
  - gerenciar assinaturas por aplicação 

### BACKEND

**controle assinatura - backend**

gerencia as assinaturas e serviços dos bots e aplicações

**atendimento clinico - backend**

faz toda a parte de atendimento clinico para os bots


   
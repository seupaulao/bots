# Controle de Assinaturas Backend

Serviço Node.js + Fastify para o Programa de Controle de Assinatura.

## Executar localmente

```bash
npm install
npm run dev
```

Vou organizar tudo como uma especificação técnica para seu README, separando três partes:

1. **Modelo de dados:** entidades, campos, tipos e relacionamentos.
2. **Contrato da API:** métodos HTTP, endpoints e suas responsabilidades.
3. **Prompt para seu agente de desenvolvimento:** um documento de instruções completo para criar o backend.

Vou considerar a arquitetura que definimos: Node.js, Fastify, TypeScript, PostgreSQL, Prisma ORM, Google OAuth e usuários independentes por aplicativo.

# **1. Especificação do modelo de dados**

## **1.1. Aplicativo (**`Aplicativo`**)**

Representa cada aplicativo que utilizará a API centralizada de assinaturas.

| Campo         | Tipo         | Obrigatório | Descrição                               |
| ------------- | ------------ | ----------- | --------------------------------------- |
| id            | UUID         | Sim         | Identificador                           |
| nome          | VARCHAR(100) | Sim         | Nome do aplicativo                      |
| identificador | VARCHAR(80)  | Sim         | Identificador único, ex.: meu-conversor |
| apiKeyHash    | VARCHAR(255) | Sim         | Hash da chave de integração             |
| ativo         | BOOLEAN      | Sim         | Aplicativo habilitado                   |
| criadoEm      | TIMESTAMP    | Sim         | Data de criação                         |
| atualizadoEm  | TIMESTAMP    | Sim         | Data da atualização                     |

**Restrições:**

- `id`: chave primária.
- `identificador`: UNIQUE.
- Um aplicativo possui vários usuários, planos, recursos e eventos de webhook.

## **1.2. Usuário (**`Usuario`**)**

Representa um usuário dentro de um aplicativo específico.

| Campo          | Tipo         | Obrigatório | Descrição                  |
| -------------- | ------------ | ----------- | -------------------------- |
| id             | UUID         | Sim         | Identificador              |
| idAplicativo   | UUID         | Sim         | Aplicativo associado       |
| nome           | VARCHAR(150) | Sim         | Nome do usuário            |
| email          | VARCHAR(255) | Sim         | E-mail Google              |
| googleSub      | VARCHAR(255) | Sim         | Identificador único Google |
| dataNascimento | DATE         | Não         | Data de nascimento         |
| ativo          | BOOLEAN      | Sim         | Usuário habilitado         |
| criadoEm       | TIMESTAMP    | Sim         | Data de criação            |
| atualizadoEm   | TIMESTAMP    | Sim         | Data de atualização        |

**Restrições:**

- FK `idAplicativo`.
- UNIQUE (`idAplicativo`, `email`).
- UNIQUE (`idAplicativo`, `googleSub`).
- UNIQUE (`id`, `idAplicativo`), para relacionamentos compostos.

O mesmo Google Account poderá ter usuários independentes em diferentes aplicativos.

## **1.3. Plano (**`Plano`**)**

Representa os produtos comerciais oferecidos por cada aplicativo.

| Campo           | Tipo          | Obrigatório | Descrição                                     |
| --------------- | ------------- | ----------- | --------------------------------------------- |
| id              | UUID          | Sim         | Identificador                                 |
| idAplicativo    | UUID          | Sim         | Aplicativo associado                          |
| nome            | VARCHAR(100)  | Sim         | Nome do plano                                 |
| codigo          | VARCHAR(80)   | Sim         | Código único no aplicativo                    |
| tipoAssinatura  | ENUM          | Sim         | NONE, NOADSBANNER, PREMIUM                    |
| tipoFaturamento | ENUM          | Sim         | NONE, ONESHOT, DIARIO, SEMANAL, MENSAL, ANUAL |
| valor           | DECIMAL(10,2) | Sim         | Preço                                         |
| moeda           | CHAR(3)       | Sim         | BRL, USD etc.                                 |
| ativo           | BOOLEAN       | Sim         | Plano disponível                              |
| criadoEm        | TIMESTAMP     | Sim         | Data de criação                               |
| atualizadoEm    | TIMESTAMP     | Sim         | Data de atualização                           |

**Restrições:**

- FK `idAplicativo`.
- UNIQUE (`idAplicativo`, `codigo`).
- UNIQUE (`id`, `idAplicativo`).

O plano gratuito não precisa ser cadastrado como contratação de cada usuário. Ele será o padrão quando não houver contratação paga válida.

## **1.4. Contratação (**`Contratacao`**)**

Representa a aquisição de um plano por um usuário.

| Campo                | Tipo          | Obrigatório | Descrição                  |
| -------------------- | ------------- | ----------- | -------------------------- |
| id                   | UUID          | Sim         | Identificador              |
| idAplicativo         | UUID          | Sim         | Aplicativo                 |
| idUsuario            | UUID          | Sim         | Usuário contratante        |
| idPlano              | UUID          | Sim         | Plano contratado           |
| status               | ENUM          | Sim         | Situação da contratação    |
| valorContratado      | DECIMAL(10,2) | Sim         | Preço no momento da compra |
| moeda                | CHAR(3)       | Sim         | Moeda da contratação       |
| origem               | ENUM          | Sim         | Provedor de pagamento      |
| identificadorExterno | VARCHAR(255)  | Não         | ID no provedor             |
| dataInicio           | TIMESTAMP     | Não         | Início do acesso           |
| dataFim              | TIMESTAMP     | Não         | Fim do acesso              |
| canceladaEm          | TIMESTAMP     | Não         | Data do cancelamento       |
| criadoEm             | TIMESTAMP     | Sim         | Data de criação            |
| atualizadoEm         | TIMESTAMP     | Sim         | Data de atualização        |

**Status possíveis:**

- `PENDING`
- `ACTIVE`
- `CANCELED`
- `EXPIRED`
- `PAST_DUE`
- `REFUNDED`

**Origem:**

- `MANUAL`
- `MERCADO_PAGO`
- `STRIPE`
- `GOOGLE_PLAY`

**Regras:**

- Uma compra lifetime pode ter `dataFim = null`.
- Uma contratação cancelada pode continuar liberando acesso até `dataFim`.
- O histórico de contratações deve ser preservado.
- O aplicativo do usuário e o aplicativo do plano devem ser iguais.

## **1.5. Pagamento (**`Pagamento`**)**

Representa cada transação financeira de uma contratação.

| Campo                | Tipo          | Obrigatório | Descrição                |
| -------------------- | ------------- | ----------- | ------------------------ |
| id                   | UUID          | Sim         | Identificador            |
| idAplicativo         | UUID          | Sim         | Aplicativo               |
| idContratacao        | UUID          | Sim         | Contratação associada    |
| valor                | DECIMAL(10,2) | Sim         | Valor pago               |
| moeda                | CHAR(3)       | Sim         | Moeda                    |
| status               | ENUM          | Sim         | Situação do pagamento    |
| provedor             | ENUM          | Sim         | Gateway utilizado        |
| identificadorExterno | VARCHAR(255)  | Não         | Identificador no gateway |
| dataPagamento        | TIMESTAMP     | Não         | Data de aprovação        |
| criadoEm             | TIMESTAMP     | Sim         | Data de criação          |

**Status:**

- `PENDING`
- `APPROVED`
- `REJECTED`
- `REFUNDED`
- `CANCELED`

Uma contratação mensal pode possuir diversos pagamentos, um para cada renovação.

## **1.6. Recurso (**`Recurso`**)**

Representa funcionalidades que podem ser liberadas dentro de cada aplicativo.

| Campo        | Tipo         | Obrigatório | Descrição                |
| ------------ | ------------ | ----------- | ------------------------ |
| id           | UUID         | Sim         | Identificador            |
| idAplicativo | UUID         | Sim         | Aplicativo associado     |
| codigo       | VARCHAR(100) | Sim         | Código da funcionalidade |
| descricao    | VARCHAR(255) | Sim         | Descrição                |

Exemplos:

| Código                | Funcionalidade        |
| --------------------- | --------------------- |
| REMOVE_ADS            | Remover anúncios      |
| UNLIMITED_CONVERSIONS | Conversões ilimitadas |
| ADVANCED_UNITS        | Unidades avançadas    |
| EXPORT_PDF            | Exportação PDF        |

**Restrições:**

- FK `idAplicativo`.
- UNIQUE (`idAplicativo`, `codigo`).

## **1.7. PlanoRecurso (**`PlanoRecurso`**)**

Tabela intermediária que associa planos aos recursos liberados.

| Campo        | Tipo | Obrigatório | Descrição  |
| ------------ | ---- | ----------- | ---------- |
| idPlano      | UUID | Sim         | Plano      |
| idRecurso    | UUID | Sim         | Recurso    |
| idAplicativo | UUID | Sim         | Aplicativo |

**Restrições:**

- Chave primária composta (`idPlano`, `idRecurso`).
- FK composta para Plano.
- FK composta para Recurso.
- Os dois registros devem pertencer ao mesmo aplicativo.

## **1.8. EventoWebhook (**`EventoWebhook`**)**

Armazena notificações recebidas dos gateways de pagamento.

| Campo                | Tipo         | Obrigatório | Descrição                 |
| -------------------- | ------------ | ----------- | ------------------------- |
| id                   | UUID         | Sim         | Identificador             |
| idAplicativo         | UUID         | Sim         | Aplicativo                |
| provedor             | ENUM         | Sim         | Gateway de origem         |
| identificadorExterno | VARCHAR(255) | Sim         | Identificador do evento   |
| status               | ENUM         | Sim         | Situação do processamento |
| payload              | JSON         | Sim         | Conteúdo recebido         |
| recebidoEm           | TIMESTAMP    | Sim         | Data de recebimento       |
| processadoEm         | TIMESTAMP    | Não         | Data de processamento     |
| erro                 | TEXT         | Não         | Erro ocorrido             |

**Status:**

- `RECEIVED`
- `PROCESSED`
- `FAILED`

**Regra:** o identificador do evento deve ser único por aplicativo e provedor, evitando processamento duplicado.

# **2. Métodos disponíveis na API**

Vou separar os endpoints em cinco grupos.

- Autenticação.
- Usuários e permissões.
- Planos e contratações.
- Pagamentos e webhooks.
- Administração.

Todos os endpoints utilizarão o prefixo `/api/v1`.

## **2.1. Autenticação**

| Método | Endpoint        | Descrição                               |
| ------ | --------------- | --------------------------------------- |
| POST   | `/auth/google`  | Autenticar usando Google ID Token       |
| POST   | `/auth/refresh` | Renovar JWT da API                      |
| POST   | `/auth/logout`  | Encerrar sessão / revogar refresh token |
| GET    | `/auth/me`      | Consultar usuário autenticado           |

O aplicativo envia o Google ID Token. A API valida o token, identifica o aplicativo e cria ou recupera o usuário.

A API retorna seu próprio JWT e, opcionalmente, um refresh token.

## **2.2. Usuários e permissões**

| Método | Endpoint                  | Descrição                              |
| ------ | ------------------------- | -------------------------------------- |
| GET    | `/users/me`               | Consultar dados do usuário             |
| PATCH  | `/users/me`               | Atualizar dados do usuário             |
| DELETE | `/users/me`               | Solicitar exclusão da conta            |
| GET    | `/users/me/entitlements`  | Consultar permissões e funcionalidades |
| GET    | `/users/me/subscriptions` | Consultar contratações                 |
| GET    | `/users/me/payments`      | Consultar histórico de pagamentos      |

O usuário será identificado pelo JWT, não por um ID arbitrário enviado pelo aplicativo.

## **2.3. Planos**

| Método | Endpoint     | Descrição                          |
| ------ | ------------ | ---------------------------------- |
| GET    | `/plans`     | Listar planos ativos do aplicativo |
| GET    | `/plans/:id` | Consultar detalhes de um plano     |

Esses endpoints são públicos para clientes autenticados, mas sempre filtrados pelo aplicativo identificado na sessão.

## **2.4. Contratações**

| Método | Endpoint                        | Descrição                              |
| ------ | ------------------------------- | -------------------------------------- |
| POST   | `/purchases`                    | Iniciar uma contratação                |
| GET    | `/purchases/:id`                | Consultar uma contratação              |
| POST   | `/subscriptions/:id/cancel`     | Solicitar cancelamento                 |
| POST   | `/subscriptions/:id/reactivate` | Solicitar reativação, quando suportada |
| POST   | `/subscriptions/restore`        | Restaurar compras anteriores           |

Observação: `POST /purchases` não deve simplesmente marcar a contratação como ativa. Deve iniciar o fluxo de pagamento ou validação da compra. A ativação acontece somente após confirmação confiável.

## **2.5. Pagamentos e webhooks**

| Método | Endpoint                 | Descrição                        |
| ------ | ------------------------ | -------------------------------- |
| GET    | `/payments/:id`          | Consultar pagamento              |
| POST   | `/webhooks/mercado-pago` | Receber eventos Mercado Pago     |
| POST   | `/webhooks/stripe`       | Receber eventos Stripe           |
| POST   | `/webhooks/google-play`  | Receber notificações Google Play |

Os webhooks não utilizarão a autenticação JWT normal. Cada provedor terá seu mecanismo de validação de assinatura ou autenticidade.

## **2.6. Administração**

Esses endpoints serão utilizados por você, não pelos aplicativos clientes.

| Método | Endpoint                                 | Descrição                        |
| ------ | ---------------------------------------- | -------------------------------- |
| POST   | `/admin/applications`                    | Cadastrar aplicativo             |
| GET    | `/admin/applications`                    | Listar aplicativos               |
| GET    | `/admin/applications/:id`                | Consultar aplicativo             |
| PATCH  | `/admin/applications/:id`                | Atualizar aplicativo             |
| POST   | `/admin/applications/:id/rotate-key`     | Renovar credencial de integração |
| POST   | `/admin/plans`                           | Criar plano                      |
| GET    | `/admin/plans`                           | Listar planos                    |
| PATCH  | `/admin/plans/:id`                       | Atualizar plano                  |
| DELETE | `/admin/plans/:id`                       | Desativar plano                  |
| POST   | `/admin/resources`                       | Criar recurso                    |
| PATCH  | `/admin/resources/:id`                   | Atualizar recurso                |
| POST   | `/admin/plans/:id/resources`             | Associar recursos ao plano       |
| DELETE | `/admin/plans/:id/resources/:resourceId` | Remover recurso do plano         |
| GET    | `/admin/users`                           | Consultar usuários               |
| GET    | `/admin/subscriptions`                   | Consultar contratações           |
| POST   | `/admin/subscriptions/:id/grant`         | Conceder acesso manual           |
| POST   | `/admin/subscriptions/:id/revoke`        | Revogar acesso                   |
| GET    | `/admin/payments`                        | Consultar pagamentos             |
| GET    | `/admin/webhooks`                        | Consultar eventos recebidos      |

**Importante:** a administração precisa de uma autenticação própria, com autorização de administrador. Não basta possuir a API Key de um aplicativo.

## **2.7. Resumo dos endpoints**

API v1

Quantidade aproximada de operações previstas

# **4**

Autenticação

# **6**

Usuários

# **2**

Planos

# **5**

Contratações

# **4**

Pagamentos

# **21**

Administração

# **3. Prompt para criação do backend usando TUI**

Agora vem a parte mais importante: o prompt para seu agente de programação.

Preparei o prompt para funcionar com Codex, OpenCode ou outro agente de desenvolvimento capaz de trabalhar sobre o projeto e executar comandos.

A ideia é não pedir simplesmente para gerar arquivos. Vamos orientar o agente a construir o projeto em etapas, validar o banco, implementar regras de negócio, testes e documentação.

# PROMPT — Desenvolvimento da Subscription Management API

## 1. Contexto do projeto

Desenvolva um backend centralizado para gerenciamento de assinaturas, contratações, pagamentos e permissões de múltiplos aplicativos.

A API será utilizada por diversos aplicativos Android e futuramente aplicações Web.

Cada aplicativo terá seus próprios usuários, planos, recursos e contratações, mantendo isolamento completo entre os aplicativos.

O objetivo é permitir que novos aplicativos utilizem a mesma infraestrutura de monetização, sem precisar implementar novamente o controle de assinaturas.

## 2. Stack tecnológica obrigatória

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Prisma ORM
- Google OAuth 2.0 / Google ID Token
- JWT para autenticação própria da API
- Zod para validação de dados
- Swagger / OpenAPI para documentação
- Vitest para testes automatizados
- Docker e Docker Compose para ambiente de desenvolvimento

Utilize versões estáveis e compatíveis das dependências.

Antes de implementar, verifique a versão do Prisma e utilize a configuração correspondente, evitando misturar sintaxes de versões diferentes.

## 3. Arquitetura

Utilize arquitetura modular, separando responsabilidades.

Estrutura sugerida:

src/\
modules/\
applications/\
authentication/\
users/\
plans/\
subscriptions/\
payments/\
entitlements/\
resources/\
webhooks/\
administration/

providers/\
google/\
mercado-pago/\
stripe/\
google-play/

plugins/\
prisma/\
authentication/\
authorization/

shared/\
errors/\
enums/\
utils/\
schemas/

app.ts\
server.ts

prisma/\
schema.prisma\
migrations/

tests/\
unit/\
integration/

Não implemente toda a lógica diretamente nas rotas Fastify.

Cada módulo deve possuir, quando aplicável:

- Routes
- Controller
- Service
- Repository
- Schemas
- Types

Utilize injeção de dependências quando apropriado.

## 4. Modelo de dados

Implemente as seguintes entidades:

### Aplicativo

- id: UUID
- nome: VARCHAR(100)
- identificador: VARCHAR(80), UNIQUE
- apiKeyHash: VARCHAR(255)
- ativo: BOOLEAN
- criadoEm: TIMESTAMP
- atualizadoEm: TIMESTAMP

### Usuario

- id: UUID
- idAplicativo: UUID
- nome: VARCHAR(150)
- email: VARCHAR(255)
- googleSub: VARCHAR(255)
- dataNascimento: DATE, nullable
- ativo: BOOLEAN
- criadoEm: TIMESTAMP
- atualizadoEm: TIMESTAMP

Restrições:

- UNIQUE(idAplicativo, email)
- UNIQUE(idAplicativo, googleSub)
- UNIQUE(id, idAplicativo)

### Plano

- id: UUID
- idAplicativo: UUID
- nome: VARCHAR(100)
- codigo: VARCHAR(80)
- tipoAssinatura: TipoAssinatura
- tipoFaturamento: TipoFaturamento
- valor: DECIMAL(10,2)
- moeda: CHAR(3)
- ativo: BOOLEAN
- criadoEm: TIMESTAMP
- atualizadoEm: TIMESTAMP

Restrições:

- UNIQUE(idAplicativo, codigo)
- UNIQUE(id, idAplicativo)

### Contratacao

- id: UUID
- idAplicativo: UUID
- idUsuario: UUID
- idPlano: UUID
- status: StatusContratacao
- valorContratado: DECIMAL(10,2)
- moeda: CHAR(3)
- origem: ProvedorPagamento
- identificadorExterno: VARCHAR(255), nullable
- dataInicio: TIMESTAMP, nullable
- dataFim: TIMESTAMP, nullable
- canceladaEm: TIMESTAMP, nullable
- criadoEm: TIMESTAMP
- atualizadoEm: TIMESTAMP

Restrições:

- Relacionamento composto com Usuario utilizando idUsuario e idAplicativo.
- Relacionamento composto com Plano utilizando idPlano e idAplicativo.
- UNIQUE(id, idAplicativo).
- UNIQUE(idAplicativo, origem, identificadorExterno).

### Pagamento

- id: UUID
- idAplicativo: UUID
- idContratacao: UUID
- valor: DECIMAL(10,2)
- moeda: CHAR(3)
- status: StatusPagamento
- provedor: ProvedorPagamento
- identificadorExterno: VARCHAR(255), nullable
- dataPagamento: TIMESTAMP, nullable
- criadoEm: TIMESTAMP

### Recurso

- id: UUID
- idAplicativo: UUID
- codigo: VARCHAR(100)
- descricao: VARCHAR(255)

Restrições:

- UNIQUE(idAplicativo, codigo)
- UNIQUE(id, idAplicativo)

### PlanoRecurso

- idPlano: UUID
- idRecurso: UUID
- idAplicativo: UUID

Chave primária composta:

- idPlano
- idRecurso

As relações devem impedir associações entre recursos e planos de aplicativos diferentes.

### EventoWebhook

- id: UUID
- idAplicativo: UUID
- provedor: ProvedorPagamento
- identificadorExterno: VARCHAR(255)
- status: StatusWebhook
- payload: JSON
- recebidoEm: TIMESTAMP
- processadoEm: TIMESTAMP, nullable
- erro: TEXT, nullable

Restrição:

- UNIQUE(idAplicativo, provedor, identificadorExterno).

### Enums

TipoAssinatura:

- NONE
- NOADSBANNER
- PREMIUM

TipoFaturamento:

- NONE
- ONESHOT
- DIARIO
- SEMANAL
- MENSAL
- ANUAL

StatusContratacao:

- PENDING
- ACTIVE
- CANCELED
- EXPIRED
- PAST_DUE
- REFUNDED

StatusPagamento:

- PENDING
- APPROVED
- REJECTED
- REFUNDED
- CANCELED

ProvedorPagamento:

- MANUAL
- MERCADO_PAGO
- STRIPE
- GOOGLE_PLAY

StatusWebhook:

- RECEIVED
- PROCESSED
- FAILED

Gere o schema Prisma completo, valide sua sintaxe e crie as migrations.

## 5. Regras de negócio

### Isolamento dos aplicativos

Cada aplicativo possui usuários, planos, recursos e contratações independentes.

Todas as consultas devem considerar o aplicativo autenticado.

Nunca permita que um usuário de um aplicativo consulte dados de outro aplicativo.

Utilize chaves estrangeiras compostas para reforçar o isolamento no banco de dados.

### Autenticação Google

Implementar endpoint:

POST /api/v1/auth/google

Receber Google ID Token e validar:

- Assinatura do token.
- Emissor (iss).
- Audience (aud).
- Expiração (exp).

Utilizar o campo sub do Google como identificador da identidade.

O aplicativo deverá possuir configuração própria de OAuth Client ID, com suporte a múltiplos aplicativos.

Após autenticação, emitir JWT próprio contendo:

- sub: UUID do usuário.
- appId: UUID do aplicativo.
- iss: subscription-api.
- aud: subscription-api.
- exp: expiração do token.

Implementar refresh token com armazenamento seguro, rotação e revogação.

Não confiar em identificadores de usuário enviados livremente pelo cliente.

### Plano gratuito

O plano gratuito é implícito.

Não criar contratações gratuitas automaticamente.

Quando o usuário não possuir uma contratação paga válida, retornar os recursos gratuitos definidos para aquele aplicativo.

O conjunto de recursos gratuitos deve ser configurável por aplicativo.

### Contratações

Permitir:

- Assinaturas recorrentes.
- Compras únicas.
- Compras lifetime.
- Cancelamento.
- Reativação quando suportada pelo provedor.
- Expiração.
- Renovação.

Preservar histórico de contratações.

Uma compra lifetime terá dataFim nula.

Uma contratação cancelada poderá continuar liberando recursos até o fim do período pago.

Não ativar uma contratação somente porque o aplicativo cliente informou que houve pagamento.

### Pagamentos

Manter histórico de transações.

Uma contratação recorrente poderá possuir vários pagamentos.

Não sobrescrever pagamentos anteriores.

Preservar o valor contratado, mesmo quando o preço do plano for alterado.

Implementar processamento idempotente de pagamentos.

### Entitlements

Criar um serviço central chamado EntitlementsService.

Ele deverá determinar os recursos liberados para determinado usuário e aplicativo.

Deverá considerar:

- Aplicativo.
- Usuário.
- Contratações.
- Status da contratação.
- Período de validade.
- Recursos associados ao plano.
- Recursos gratuitos do aplicativo.

Retornar:

- Tipo de assinatura.
- Status.
- Data de vencimento.
- Lista de recursos liberados.

Não confiar em permissões armazenadas apenas no dispositivo Android.

## 6. Endpoints obrigatórios

Prefixo: /api/v1

### Autenticação

POST /auth/google\
POST /auth/refresh\
POST /auth/logout\
GET /auth/me

### Usuários

GET /users/me\
PATCH /users/me\
DELETE /users/me

### Planos

GET /plans\
GET /plans/:id

### Contratações

POST /purchases\
GET /purchases/:id\
POST /subscriptions/:id/cancel\
POST /subscriptions/:id/reactivate\
POST /subscriptions/restore

### Permissões

GET /users/me/entitlements

### Pagamentos

GET /payments/:id

### Webhooks

POST /webhooks/mercado-pago\
POST /webhooks/stripe\
POST /webhooks/google-play

### Administração

POST /admin/applications\
GET /admin/applications\
GET /admin/applications/:id\
PATCH /admin/applications/:id\
POST /admin/applications/:id/rotate-key

POST /admin/plans\
GET /admin/plans\
PATCH /admin/plans/:id\
DELETE /admin/plans/:id

POST /admin/resources\
PATCH /admin/resources/:id

POST /admin/plans/:id/resources\
DELETE /admin/plans/:id/resources/:resourceId

GET /admin/users\
GET /admin/subscriptions

POST /admin/subscriptions/:id/grant\
POST /admin/subscriptions/:id/revoke

GET /admin/payments\
GET /admin/webhooks

Implementar autenticação administrativa independente da autenticação dos usuários dos aplicativos.

Não permitir acesso administrativo utilizando somente a API Key de um aplicativo.

## 7. Integrações de pagamento

Preparar arquitetura extensível para os seguintes provedores:

- Mercado Pago.
- Stripe.
- Google Play Billing.

Criar uma interface comum para os provedores, permitindo implementação independente.

Exemplo conceitual:

PaymentProvider:

- createPurchase()
- verifyPayment()
- cancelSubscription()
- restorePurchase()

Não implementar integrações fictícias.

Na primeira versão, deixar os adaptadores externos preparados, com configurações por ambiente e documentação das funcionalidades ainda não implementadas.

Implementar primeiramente o fluxo MANUAL para testes e administração.

Para Google Play, validar compras e notificações no servidor utilizando as APIs oficiais.

Para webhooks:

- Validar autenticidade.
- Registrar evento recebido.
- Garantir idempotência.
- Processar em transação.
- Registrar falhas.
- Permitir reprocessamento seguro.

## 8. Segurança

Implementar:

- JWT com expiração.
- Refresh token com rotação.
- Validação de entradas com Zod.
- Rate limiting.
- CORS configurável.
- Helmet ou proteção equivalente.
- Hash das API Keys.
- Autorização por aplicativo.
- Autorização administrativa.
- Proteção contra IDOR.
- Tratamento centralizado de erros.
- Logs sem informações sensíveis.
- Segredos exclusivamente em variáveis de ambiente.

A API Key distribuída em aplicativos Android não deve ser considerada segredo confiável.

## 9. Documentação

Implementar Swagger/OpenAPI.

Criar README.md contendo:

- Descrição do projeto.
- Arquitetura.
- Tecnologias.
- Estrutura de diretórios.
- Modelo de dados.
- Variáveis de ambiente.
- Instalação.
- Configuração do PostgreSQL.
- Migrações.
- Execução em desenvolvimento.
- Execução em produção.
- Endpoints.
- Autenticação.
- Integração com provedores.
- Exemplos de requisições e respostas.

Criar arquivo .env.example.

## 10. Docker

Criar Dockerfile e docker-compose.yml.

O ambiente de desenvolvimento deverá permitir subir:

- API.
- PostgreSQL.

Configurar health checks e persistência dos dados do PostgreSQL.

## 11. Testes

Criar testes unitários e de integração.

Cobrir principalmente:

1. Cadastro de aplicativos.
2. Login Google.
3. Criação de usuários.
4. Isolamento entre aplicativos.
5. Cadastro de planos.
6. Plano gratuito implícito.
7. Contratação de plano.
8. Compra lifetime.
9. Assinatura mensal.
10. Cancelamento.
11. Expiração.
12. Renovação.
13. Pagamento aprovado.
14. Pagamento rejeitado.
15. Webhook duplicado.
16. Consulta de permissões.
17. Tentativas de acesso não autorizado.

## 12. Estratégia de desenvolvimento

Não tente implementar todo o projeto de uma única vez sem validação.

Trabalhe nas seguintes etapas:

FASE 1 — Fundação

- Criar projeto.
- Configurar TypeScript e Fastify.
- Configurar PostgreSQL e Prisma.
- Implementar schema.
- Criar migrations.
- Implementar health check.

FASE 2 — Aplicativos e autenticação

- Cadastro administrativo de aplicativos.
- Configuração Google OAuth.
- Login Google.
- JWT.
- Refresh token.
- Cadastro de usuários.

FASE 3 — Planos e recursos

- CRUD administrativo de planos.
- CRUD de recursos.
- Associação entre planos e recursos.
- Configuração dos recursos gratuitos.

FASE 4 — Contratações

- Contratação manual.
- Assinaturas recorrentes.
- Compras únicas.
- Lifetime.
- Cancelamento.
- Expiração.

FASE 5 — Entitlements

- Serviço de permissões.
- Consulta de acesso.
- Regras de validade.
- Testes de isolamento.

FASE 6 — Pagamentos

- Modelo de pagamentos.
- Adaptadores.
- Webhooks.
- Idempotência.
- Integração inicial com provedor de pagamento.

FASE 7 — Finalização

- Swagger.
- Testes.
- Docker.
- README.
- Revisão de segurança.

## 13. Diretrizes para o agente

Antes de iniciar:

1. Analise os arquivos existentes no repositório.
2. Identifique se já existe alguma estrutura que deve ser preservada.
3. Apresente um plano de implementação.
4. Identifique decisões técnicas que possam comprometer a arquitetura.

Durante o desenvolvimento:

- Trabalhe por fases.
- Não gere código desnecessário.
- Não duplique regras de negócio.
- Não misture responsabilidades entre módulos.
- Utilize transações do Prisma quando necessário.
- Mantenha tipagem forte.
- Execute migrations e testes.
- Corrija erros antes de avançar.
- Não utilize dados fictícios em integrações apresentadas como funcionais.
- Não exponha credenciais ou tokens.
- Não altere o schema sem atualizar as migrations e os testes.

Ao concluir cada fase, apresente:

- Arquivos criados.
- Funcionalidades implementadas.
- Testes executados.
- Resultado dos testes.
- Pendências.
- Próxima fase sugerida.

**Comece pela análise do repositório e pela FASE 1. Não avance automaticamente por todas as fases sem validar cada etapa.**

# **4. Minha sugestão para trabalhar com o TUI**

Eu recomendo não pedir ao agente para implementar tudo de uma vez. Use o prompt como especificação do projeto e trabalhe em etapas.

Uma sequência interessante seria:

| Etapa | Resultado esperado                                |
| ----- | ------------------------------------------------- |
| 1     | Projeto Fastify + Prisma + PostgreSQL funcionando |
| 2     | Aplicativos e autenticação Google                 |
| 3     | Planos e recursos                                 |
| 4     | Contratações e permissões                         |
| 5     | Pagamentos e webhooks                             |
| 6     | Testes, documentação e deploy                     |

**Um detalhe que eu acrescentaria antes de começar:** o schema precisa contemplar também uma configuração de recursos gratuitos por aplicativo. Você pode fazer isso adicionando uma relação entre `Aplicativo` e `Recurso`, ou uma tabela `AplicativoRecursoGratuito`. Isso evita que o plano gratuito dependa de uma regra fixa no código.

Assim, sua API terá uma característica muito importante: você poderá lançar um novo aplicativo, cadastrar seus recursos e planos e começar a controlar assinaturas sem modificar a lógica central do backend.
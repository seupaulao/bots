# Plano de Implementação — Atendimento Clínico Backend

## Arquitetura

- **Runtime:** Node.js 20
- **Framework:** Fastify 4
- **Banco:** PostgreSQL 16
- **Autenticação:** JWT (@fastify/jwt)
- **Senhas:** bcrypt

## Estrutura do Projeto

```
atendimento_clinico_backend/
├── Dockerfile
├── package.json
├── server.js
├── .env.example
├── banco.sql
├── plan_atendimento_clinico_backend.md
└── src/
    ├── app.js
    ├── config/
    │   └── database.js
    ├── plugins/
    │   └── auth.js
    ├── routes/
    │   ├── auth.js
    │   ├── especialidades.js
    │   ├── usuarios.js
    │   ├── campanhas.js
    │   ├── atendimentos.js
    │   └── anamneses.js
    └── controllers/
        ├── authController.js
        ├── especialidadesController.js
        ├── usuariosController.js
        ├── campanhasController.js
        ├── atendimentosController.js
        └── anamnesesController.js
```

## Banco de Dados

### Modelo Entidade-Relacionamento (resumido)

```
usuarios 1---N usuario_especialidade N---1 especialidades
usuarios 1---1 seguranca
campanhas 1---N campanha_profissional_especialidade N---1 usuarios (profissional)
campanha_profissional_especialidade N---1 especialidades
campanhas 1---N atendimentos N---1 usuarios (paciente)
campanha_profissional_especialidade 1---N atendimentos
campanha_profissional_especialidade 1---N anamneses
usuarios (paciente) 1---N anamneses
```

### Tabelas

| Tabela | Descrição |
|---|---|
| usuarios | Todos os perfis: pacientes, profissionais, gestores, admin |
| seguranca | Credenciais e perfis de acesso |
| especialidades | Catálogo de especialidades médicas |
| usuario_especialidade | Vínculo profissional-especialidade |
| campanhas | Campanhas de atendimento |
| campanha_profissional_especialidade | Profissionais convocados por campanha (gera identificador de acesso) |
| atendimentos | Agendamentos e histórico de atendimentos |
| anamneses | Registros clínicos (exame, receita, laudo, consulta) |

## API Endpoints por Fluxo

### Fluxo Pré-Campanha (gestor/admin cadastra especialidades e profissionais)

| Método | Rota | Controle de Acesso |
|---|---|---|
| GET | `/api/especialidades` | autenticado |
| POST | `/api/especialidades` | admin/gestor |
| PUT | `/api/especialidades/:id` | admin/gestor |
| DELETE | `/api/especialidades/:id` | admin/gestor |
| GET | `/api/usuarios` | autenticado |
| POST | `/api/usuarios` | admin/gestor |
| GET | `/api/usuarios/:id` | autenticado |
| PUT | `/api/usuarios/:id` | admin/gestor |
| POST | `/api/usuarios/:id/especialidades` | admin/gestor |
| DELETE | `/api/usuarios/:id/especialidades/:idEsp` | admin/gestor |

### Fluxo Campanha

| Método | Rota | Ação |
|---|---|---|
| POST | `/api/campanhas` | Criar campanha |
| GET | `/api/campanhas` | Listar campanhas |
| GET | `/api/campanhas/:id` | Detalhar campanha |
| PUT | `/api/campanhas/:id` | Atualizar campanha |
| DELETE | `/api/campanhas/:id` | Remover campanha |
| POST | `/api/campanhas/:id/profissionais` | Vincular profissional+especialidade (gera identificador) |
| DELETE | `/api/campanhas/:id/profissionais/:idVinc` | Remover vínculo |
| POST | `/api/campanhas/:id/disparar` | Disparar notificações (placeholder) |

### Fluxo Cadastro Paciente

| Método | Rota | Ação |
|---|---|---|
| POST | `/api/campanhas/:id/inscricao` | Autocadastro na campanha |
| GET | `/api/campanhas/:id/horarios` | Horários disponíveis |
| POST | `/api/atendimentos` | Agendar atendimento |
| POST | `/api/atendimentos/continuar` | Novo atendimento no mesmo fluxo |

### Fluxo Atendimento

| Método | Rota | Ação |
|---|---|---|
| GET | `/api/atendimentos` | Listar (com filtros) |
| PUT | `/api/atendimentos/:id/iniciar` | Iniciar atendimento |
| PUT | `/api/atendimentos/:id/finalizar` | Finalizar atendimento |
| PUT | `/api/atendimentos/:id/desistencia` | Registrar desistência |
| PUT | `/api/atendimentos/:id/realocar` | Realocar horário |

### Anamneses

| Método | Rota | Ação |
|---|---|---|
| POST | `/api/atendimentos/:id/anamneses` | Criar anamnese |
| GET | `/api/atendimentos/:id/anamneses` | Listar anamneses |

## Ordem de Implementação

1. DDL (`banco.sql`)
2. Docker Compose (adição do PostgreSQL)
3. Inicialização do projeto (`package.json`, `Dockerfile`)
4. Configuração do banco (`database.js`)
5. Setup Fastify (`app.js`, `server.js`)
6. Plugin de autenticação JWT
7. Auth (login)
8. CRUD Especialidades
9. CRUD Usuários + vínculo especialidade
10. CRUD Campanhas + vínculo profissional
11. Atendimentos (fluxo completo)
12. Anamneses

## Docker Compose

Adicionar ao `docker-compose.yml` principal:

```yaml
postgres-atendimento:
  image: postgres:16-alpine
  container_name: postgres-atendimento
  environment:
    POSTGRES_DB: atendimento_clinico
    POSTGRES_USER: atendimento
    POSTGRES_PASSWORD: atendimento123
  ports:
    - "5432:5432"
  volumes:
    - ./atendimento_clinico_backend/banco.sql:/docker-entrypoint-initdb.d/banco.sql
    - pgdata-atendimento:/var/lib/postgresql/data
  networks:
    - app-network

atendimento-clinico-backend:
  build: ./atendimento_clinico_backend
  container_name: atendimento-clinico-backend
  ports:
    - "8001:8000"
  environment:
    - DATABASE_URL=postgres://atendimento:atendimento123@postgres-atendimento:5432/atendimento_clinico
    - JWT_SECRET=seu-jwt-secret-aqui
    - PORT=8000
  depends_on:
    - postgres-atendimento
  networks:
    - app-network

volumes:
  pgdata-atendimento:
```

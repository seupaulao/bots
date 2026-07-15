## arquitetura

nodejs
fastify
prisma ORM
banco de dados postgres

## BANCO

campanhas
  - data
  - hora
  - nome
  - especialidades/profissional

usuarios
  - nome
  - cpf
  - email
  - telefone
  - whatsup
  - telegram
  - nascimento
  - conselho
  - data inicio
  - data fim  

seguranca
  - id usuario
  - perfil
     - admin
     - gestor
     - paciente
     - profissional
  - senha


especialidades
- nome

usuario_especialidade
- id usuario
- id especialidade

atendimentos
  * data hora atendimento
  * id campanha
  * id usuario paciente
  * id profissional especialidade
  * foi concluido
  * houve desistencia     

anamneses
  * tipo
    - exame
    - receita
    - laudo
    - consulta
  * descricao
  * texto
  * id paciente
  * id profissional especialidade 

## inicialize o banco de dados

```bash
# Com Prisma, use migrações para criar as tabelas:
npx prisma migrate dev --name init

# Ou em produção:
npx prisma migrate deploy

# Seed padrão via prisma/seed.js:
npx prisma db seed

# O seed também roda automaticamente no startup do servidor
```

### Para usar

```bash
# Primeira vez — criar as tabelas no banco:
npx prisma migrate dev --name init

# Seed (admin):
npx prisma db seed

# Desenvolvimento:
npm run dev
```

## FLUXOS

**fluxo pre-campanha**
gestor cadastra ---> especialidades ---> profissionais e especialidades

**fluxo campanha**
sistema --> gera identificador de acesso ao profissional 
gestor lança campanha --> gestor indica quais profissionais/especialidade na campanha
gestor --> dispara emails/telegram/whatsup para campanha

**fluxo cadastro paciente campanha**
usuario paciente --> se cadastra na campanha --> informa os atendimentos desejados --> seleciona a data hora do atendimento dentre as disponiveis
sistema --> ao finalizar um cadastro de usuario na campanha deve perguntar se ele deseja fazer um novo atendimento
   ---> paciente informa se é para ele ou outra pessoa
   ---> se outra pessoa verfica os dados cadastrais
   ---> inicia o fluxo cadastro paciente campanha
   
**fluxo atendimento**
   paciente espera na fila seu horario ---> ao chegar o horario paciente é encaminhado ao profissional
   sistema checa se usuario esta em atendimento --> ao finalizar atendimento checar se foi concluido
                                                --> checa se houve desistencia
   se houve desistencia, realoca horarios atendimento
   possibilitar abrir cadastro de atendimento a qualquer momento 

   
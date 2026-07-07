Ótima pergunta! O **Telegraf.js** é uma das bibliotecas mais poderosas e simples para criar bots do Telegram com Node.js.

Aqui está um **guia rápido dos principais comandos, métodos e middlewares** que você usará frequentemente ao construir bots com o Telegraf.

---

## ✅ **1. Comandos principais**

### `bot.start(callback)`

Executado quando o usuário clica em "Start" no bot.

```js
bot.start((ctx) => {
  ctx.reply('Bem-vindo ao bot!')
})
```

---

### `bot.help(callback)`

Usado para mostrar ajuda ao usuário (`/help`).

```js
bot.help((ctx) => {
  ctx.reply('Comandos disponíveis:\n/start\n/help\n/me')
})
```

---

### `bot.command('nome', callback)`

Escuta comandos específicos com `/`.

```js
bot.command('me', (ctx) => {
  ctx.reply(`Seu ID: ${ctx.from.id}`)
})
```

---

### `bot.on(tipo, callback)`

Escuta tipos específicos de mensagens (texto, stickers, voz, etc).

```js
bot.on('text', (ctx) => {
  ctx.reply(`Você disse: ${ctx.message.text}`)
})

bot.on('sticker', (ctx) => {
  ctx.reply('Legal esse sticker!')
})
```

> Tipos possíveis: `'text'`, `'photo'`, `'voice'`, `'sticker'`, `'video'`, `'document'`, `'location'`, etc.

---

### `bot.hears(palavraOuRegex, callback)`

Escuta quando o usuário diz algo específico (sem precisar de `/`).

```js
bot.hears('oi', (ctx) => {
  ctx.reply('Oi! Tudo bem?')
})

bot.hears(/.*pizza.*/i, (ctx) => {
  ctx.reply('Você falou pizza! 🍕')
})
```

---

### `bot.use(middleware)`

Middleware global que intercepta todas as mensagens — útil para logs, autenticação, etc.

```js
bot.use(async (ctx, next) => {
  console.log(`[${ctx.from.username}] disse: ${ctx.message?.text}`)
  await next()
})
```

---

## 🧠 `ctx` (contexto): O objeto mais importante

Você acessa tudo por ele: usuário, chat, mensagem, envio de respostas etc.

```js
ctx.from       // dados do usuário
ctx.chat       // dados do chat
ctx.message    // mensagem recebida
ctx.reply()    // responde ao usuário
ctx.telegram.sendMessage() // API Telegram direta
```

---

## 🧾 Exemplos rápidos de envio

```js
ctx.reply('Texto simples')                       // texto
ctx.replyWithPhoto('URL ou arquivo')            // imagem
ctx.replyWithMarkdown('*Texto em negrito*')     // markdown
ctx.replyWithHTML('<b>Negrito com HTML</b>')    // HTML
ctx.sendChatAction('typing')                    // mostra "digitando..."
```

---

## 📦 Telegraf Inline Keyboard (botões)

### Enviar botões inline com uma mensagem:

```js
const { Markup } = require('telegraf')

bot.command('menu', (ctx) => {
  ctx.reply('Escolha uma opção:', Markup.inlineKeyboard([
    [Markup.button.callback('Ver perfil', 'perfil')],
    [Markup.button.url('Site', 'https://google.com')]
  ]))
})
```

### Escutar cliques nos botões inline:

```js
bot.action('perfil', (ctx) => {
  ctx.reply(`Seu ID: ${ctx.from.id}`)
})
```

---

## 🔁 Comandos extras úteis

### `bot.telegram.sendMessage(chatId, msg)`

Envia mensagem para qualquer chat pelo ID (sem `ctx`):

```js
bot.telegram.sendMessage(123456789, 'Mensagem direta')
```

### `bot.launch()`

Inicia o bot com **polling**:

```js
bot.launch()
```

---

## 🧪 Extras que vale conhecer

| Método                      | Para...                          |
| --------------------------- | -------------------------------- |
| `ctx.replyWithSticker()`    | Enviar sticker                   |
| `ctx.forwardMessage()`      | Encaminhar mensagens             |
| `ctx.answerCallbackQuery()` | Responder clique em botão inline |
| `ctx.setChatPermissions()`  | Modificar permissões em grupos   |
| `ctx.leaveChat()`           | Sair de um grupo                 |
| `ctx.kickChatMember()`      | Banir usuário                    |

---

## 📦 Comandos avançados (ex: cena, wizard)

Se quiser algo mais estruturado para diálogos interativos:

* `Scenes` → para múltiplos passos (como formulários)
* `Stage` → gerencia múltiplas cenas
* Usa `telegraf/scenes`, `session`, `wizardScene`, etc.

> Me avisa se quiser um exemplo disso também.

---

## 📌 Conclusão

### Com isso, você já cobre:

* Comandos como `/start`, `/help`, `/me`
* Respostas a texto livre (`hears`, `on`)
* Botões interativos
* Middleware global
* Envio de vários tipos de conteúdo

---

Se quiser, posso te montar um **template base completo com esses comandos prontos**, incluindo menus, `/start`, `/help`, botões, integração com API, etc.

Ótimo! O sistema de **Scenes** (cenas) do Telegraf é perfeito para criar **fluxos interativos**, como:

* formulários passo a passo
* cadastro de usuários
* configurações personalizadas
* diálogos de múltiplas etapas

O `Scenes` faz parte do módulo `telegraf/scenes` e trabalha com sessões para manter o estado entre mensagens.

---

## 🎯 Exemplo: Cadastrar Nome e Idade com `Scenes`

---

### 📦 Instale as dependências

```bash
npm install telegraf dotenv
```

---

### 📁 Estrutura do projeto

```
my-bot/
├── bot.js
├── .env
├── package.json
```

---

### 📄 .env

```env
BOT_TOKEN=123456:ABCDEF_seu_token
```

---

### 📄 bot.js

```js
const { Telegraf, Scenes, session } = require('telegraf')
require('dotenv').config()

// Etapa 1: Perguntar nome
const askNameStep = async (ctx) => {
  await ctx.reply('Qual é o seu nome?')
  return ctx.wizard.next()
}

// Etapa 2: Receber nome, perguntar idade
const askAgeStep = async (ctx) => {
  ctx.wizard.state.userData = { name: ctx.message.text }
  await ctx.reply(`Olá, ${ctx.message.text}! Agora, qual é a sua idade?`)
  return ctx.wizard.next()
}

// Etapa 3: Receber idade e finalizar
const finishStep = async (ctx) => {
  ctx.wizard.state.userData.age = ctx.message.text
  const { name, age } = ctx.wizard.state.userData
  await ctx.reply(`Cadastro completo! Nome: ${name}, Idade: ${age}`)
  return ctx.scene.leave()
}

// Criar o wizard scene
const cadastroScene = new Scenes.WizardScene(
  'cadastro',
  askNameStep,
  askAgeStep,
  finishStep
)

// Criar stage e registrar scene
const stage = new Scenes.Stage([cadastroScene])

// Criar bot e usar stage + session
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.use(stage.middleware())

// Comando para iniciar a cena
bot.command('cadastro', (ctx) => {
  ctx.scene.enter('cadastro')
})

// Comando padrão
bot.start((ctx) => {
  ctx.reply('Bem-vindo! Use o comando /cadastro para começar.')
})

bot.launch()
console.log('🤖 Bot com Wizard Scene iniciado.')
```

---

## 🚀 Como funciona?

1. Você inicia a cena com `/cadastro`.
2. O bot faz perguntas em etapas, mantendo o estado.
3. A cada mensagem do usuário, ele avança no fluxo.
4. Ao final, responde com os dados e encerra a cena.

---

## 🧠 Por trás dos panos

* `ctx.scene.enter('cadastro')` inicia a cena
* `ctx.wizard.state` armazena dados temporários da cena
* `ctx.wizard.next()` avança para o próximo passo
* `ctx.scene.leave()` encerra a cena
* `session()` guarda o progresso do usuário

---

## 🛠 Você pode expandir para:

* Perguntar email, cidade, preferências...
* Salvar os dados via API (com `axios`)
* Validar respostas
* Adicionar botões inline em cada etapa
* Criar múltiplas cenas: `cadastro`, `config`, `feedback`...

---

## ✅ Quer um template completo com múltiplas cenas e integração com Redis ou Mongo?

Posso gerar o esqueleto com:

* `/start`, `/help`, `/cadastro`
* Cenas bem separadas em arquivos
* Suporte a persistência com API externa
* Deploy-ready (Railway ou local)

Quer que eu monte esse projeto pra você?

Perfeito! Vamos criar um exemplo completo de bot com múltiplas scenes, **menu inline para navegação** e **persistência dos dados em Redis**.

---

## O que vamos fazer:

* 3 cenas: configuração do app, cadastro de pacientes e cadastro de médicos
* Menu inline para escolher qual cena entrar
* Persistência dos dados coletados no Redis (usando `ioredis`)
* Opção de voltar ao menu principal a qualquer momento

---

## Passo a passo

### 1. Dependências

```bash
npm install telegraf dotenv ioredis
```

---

### 2. Estrutura do código completo `bot.js`

```js
const { Telegraf, Scenes, session, Markup } = require('telegraf')
const Redis = require('ioredis')
require('dotenv').config()

// Conexão Redis
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// ======== Helpers para salvar no Redis ========
async function saveData(userId, key, data) {
  await redis.hset(`user:${userId}`, key, JSON.stringify(data))
}

async function getData(userId, key) {
  const data = await redis.hget(`user:${userId}`, key)
  return data ? JSON.parse(data) : null
}

// ======== Menu Inline ========
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('⚙️ Configuração do app', 'menu_config')],
  [Markup.button.callback('👨‍👩‍👧 Cadastro de pacientes', 'menu_patient')],
  [Markup.button.callback('👨‍⚕️ Cadastro de médicos', 'menu_doctor')],
])

// ======== CENA 1: Configuração do app ========
const configStep1 = async (ctx) => {
  await ctx.reply('Qual o nome do app?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
  return ctx.wizard.next()
}
const configStep2 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.appConfig = { appName: ctx.message.text }
    await saveData(ctx.from.id, 'appConfig', ctx.wizard.state.appConfig)
    await ctx.reply(`App "${ctx.message.text}" configurado! Qual o modo? (ex: produção/teste)`, Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
    return ctx.wizard.next()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const configStep3 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.appConfig.mode = ctx.message.text
    await saveData(ctx.from.id, 'appConfig', ctx.wizard.state.appConfig)
    await ctx.reply(`Modo definido como "${ctx.message.text}". Configuração concluída!`, mainMenu)
    return ctx.scene.leave()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const configScene = new Scenes.WizardScene('config', configStep1, configStep2, configStep3)

// ======== CENA 2: Cadastro de pacientes ========
const patientStep1 = async (ctx) => {
  await ctx.reply('Qual o nome completo do paciente?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
  return ctx.wizard.next()
}
const patientStep2 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.patient = { name: ctx.message.text }
    await ctx.reply('Qual a idade?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
    return ctx.wizard.next()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const patientStep3 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.patient.age = ctx.message.text
    await ctx.reply('Qual o telefone?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
    return ctx.wizard.next()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const patientStep4 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.patient.phone = ctx.message.text
    await saveData(ctx.from.id, 'patient_' + Date.now(), ctx.wizard.state.patient)
    await ctx.reply(`Paciente cadastrado:\nNome: ${ctx.wizard.state.patient.name}\nIdade: ${ctx.wizard.state.patient.age}\nTelefone: ${ctx.wizard.state.patient.phone}`, mainMenu)
    return ctx.scene.leave()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const patientScene = new Scenes.WizardScene('patient', patientStep1, patientStep2, patientStep3, patientStep4)

// ======== CENA 3: Cadastro de médicos ========
const doctorStep1 = async (ctx) => {
  await ctx.reply('Qual o nome completo do médico?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
  return ctx.wizard.next()
}
const doctorStep2 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.doctor = { name: ctx.message.text }
    await ctx.reply('Qual a especialidade?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
    return ctx.wizard.next()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const doctorStep3 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.doctor.specialty = ctx.message.text
    await ctx.reply('Qual o CRM?', Markup.inlineKeyboard([Markup.button.callback('Voltar ao menu', 'back_to_menu')]))
    return ctx.wizard.next()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const doctorStep4 = async (ctx) => {
  if (ctx.message?.text) {
    ctx.wizard.state.doctor.crm = ctx.message.text
    await saveData(ctx.from.id, 'doctor_' + Date.now(), ctx.wizard.state.doctor)
    await ctx.reply(`Médico cadastrado:\nNome: ${ctx.wizard.state.doctor.name}\nEspecialidade: ${ctx.wizard.state.doctor.specialty}\nCRM: ${ctx.wizard.state.doctor.crm}`, mainMenu)
    return ctx.scene.leave()
  }
  await ctx.reply('Por favor, envie um texto válido.')
}
const doctorScene = new Scenes.WizardScene('doctor', doctorStep1, doctorStep2, doctorStep3, doctorStep4)

// ======== Stage: registrar todas as scenes ========
const stage = new Scenes.Stage([configScene, patientScene, doctorScene])

// ======== Criar bot e usar session e stage ========
const bot = new Telegraf(process.env.BOT_TOKEN)
bot.use(session())
bot.use(stage.middleware())

// Menu principal via callback_query
bot.action('menu_config', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.enter('config')
})

bot.action('menu_patient', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.enter('patient')
})

bot.action('menu_doctor', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.enter('doctor')
})

// Voltar ao menu
bot.action('back_to_menu', (ctx) => {
  ctx.answerCbQuery()
  ctx.scene.leave()
  ctx.editMessageText('Menu principal:', mainMenu)
})

// Comando /start mostra menu principal
bot.start((ctx) => {
  ctx.reply('Bem-vindo! Escolha uma opção:', mainMenu)
})

// Opcional: comando /menu para chamar o menu a qualquer momento
bot.command('menu', (ctx) => {
  ctx.reply('Menu principal:', mainMenu)
})

bot.launch()
console.log('🤖 Bot rodando com múltiplas scenes, menu inline e Redis!')
```

---

### 3. Variáveis de ambiente no `.env`

```
BOT_TOKEN=seu_token_aqui
REDIS_URL=redis://localhost:6379  # ou a URL do seu Redis na nuvem
```

---

## Explicação:

* Os dados de cada usuário são armazenados no Redis com chave `user:<userId>`, em campos distintos (ex: `appConfig`, `patient_<timestamp>`, `doctor_<timestamp>`)
* Menu inline permite navegar entre cenas e voltar ao menu principal a qualquer hora
* O bot usa `session()` para manter o estado do usuário entre mensagens
* Cada cena tem botões "Voltar ao menu" para permitir sair do fluxo

---

Se quiser, posso ajudar a montar o deploy do bot com Redis no Railway, Vercel, ou AWS também.

Claro! Vou te explicar como usar o **`Stages`** no Telegraf para gerenciar múltiplas cenas (ou "flows") de forma organizada.

---

# O que é o `Stage` no Telegraf?

* **`Stage`** é um gerenciador de cenas, ele agrupa várias cenas (`Scenes.WizardScene` ou `Scenes.BaseScene`).
* Com ele, você pode facilmente alternar entre cenas e garantir que o usuário esteja em apenas uma cena ativa por vez.
* Ele fornece o middleware para habilitar a navegação e controle do fluxo do usuário dentro das cenas.

---

# Como usar o `Stage`

### Passos básicos:

1. **Crie suas cenas** (por exemplo, com `WizardScene` para fluxos passo a passo).
2. **Crie o Stage e registre suas cenas** nele.
3. **Use o middleware do Stage** no seu bot.
4. **Controle a entrada e saída das cenas** usando `ctx.scene.enter('nomeDaCena')` e `ctx.scene.leave()`.

---

# Exemplo simples com duas cenas:

```js
const { Telegraf, Scenes, session } = require('telegraf')

const bot = new Telegraf('SEU_TOKEN')

// Criar cena 1 (WizardScene com 2 passos)
const cenaUm = new Scenes.WizardScene('cenaUm',
  async (ctx) => {
    await ctx.reply('Passo 1 da Cena 1: Qual seu nome?')
    return ctx.wizard.next()
  },
  async (ctx) => {
    ctx.wizard.state.nome = ctx.message.text
    await ctx.reply(`Olá, ${ctx.message.text}!`)
    return ctx.scene.leave()
  }
)

// Criar cena 2 (WizardScene com 2 passos)
const cenaDois = new Scenes.WizardScene('cenaDois',
  async (ctx) => {
    await ctx.reply('Passo 1 da Cena 2: Qual sua idade?')
    return ctx.wizard.next()
  },
  async (ctx) => {
    ctx.wizard.state.idade = ctx.message.text
    await ctx.reply(`Você tem ${ctx.message.text} anos.`)
    return ctx.scene.leave()
  }
)

// Criar stage e registrar cenas
const stage = new Scenes.Stage([cenaUm, cenaDois])

// Middleware session para manter estado
bot.use(session())
// Middleware stage para gerenciar cenas
bot.use(stage.middleware())

// Comandos para entrar nas cenas
bot.command('nome', (ctx) => ctx.scene.enter('cenaUm'))
bot.command('idade', (ctx) => ctx.scene.enter('cenaDois'))

bot.start((ctx) => {
  ctx.reply('Use /nome para dizer seu nome e /idade para sua idade')
})

bot.launch()
```

---

# Pontos importantes sobre o `Stage`:

* **`stage.middleware()`** deve ser usado depois do `session()`
* Só pode estar em **uma cena ativa por vez** para cada usuário
* Você controla a cena do usuário com:

  * `ctx.scene.enter('nomeDaCena')` → entra na cena
  * `ctx.scene.leave()` → sai da cena, volta ao fluxo normal do bot
* Dentro das cenas, você controla o fluxo com `ctx.wizard.next()` para ir para o próximo passo no WizardScene
* Pode salvar dados temporários dentro do objeto `ctx.wizard.state`

---

Se quiser, posso montar um exemplo mais complexo, com persistência, menus inline e integração com banco.

---

Claro! Aqui está um prompt detalhado, consolidando tudo o que fizemos até agora — ideal para você usar como base para um projeto ou para pedir ajuda em fóruns, chats ou mesmo para gerar código com IA:

---

# Prompt consolidado para bot Telegram com Telegraf.js

---

**Contexto:**
Estou desenvolvendo um bot para Telegram usando Telegraf.js que gerencia múltiplas cenas para diferentes fluxos, com menus inline para navegação, e persistência dos dados usando Redis.

---

**Funcionalidades do bot:**

1. **Múltiplas cenas (Scenes / WizardScenes):**

   * Configuração do app (nome do app, modo de operação)
   * Cadastro de pacientes (nome, idade, telefone)
   * Cadastro de médicos (nome, especialidade, CRM)

2. **Menu inline:**

   * Menu principal com botões para entrar em cada fluxo (Configuração, Paciente, Médico)
   * Botão “Voltar ao menu” em cada etapa para sair do fluxo e voltar para o menu principal

3. **Persistência de dados no Redis:**

   * Cada usuário tem suas informações armazenadas em Redis
   * Dados salvos em hash por usuário, com chaves específicas (ex: `appConfig`, `patient_<timestamp>`, `doctor_<timestamp>`)

4. **Gerenciamento de fluxo com `Scenes` e `Stage`:**

   * Uso de `WizardScene` para fluxo passo a passo
   * Uso de `Stage` para registrar e gerenciar as cenas
   * Middleware `session()` para manter o estado do usuário entre mensagens

5. **Comandos:**

   * `/start` — mostra o menu principal
   * `/config` — entra na cena de configuração do app
   * `/patient` — entra na cena de cadastro de paciente
   * `/doctor` — entra na cena de cadastro de médico
   * `/menu` — mostra o menu principal a qualquer momento

---

**Exemplo básico de uso do Stage e Scenes:**

```js
const { Telegraf, Scenes, session, Markup } = require('telegraf')
const Redis = require('ioredis')
require('dotenv').config()

const redis = new Redis(process.env.REDIS_URL)

// Helpers para salvar e buscar dados no Redis
async function saveData(userId, key, data) { ... }
async function getData(userId, key) { ... }

// Definição das cenas WizardScene para config, paciente e médico
const configScene = new Scenes.WizardScene('config', step1, step2, step3)
const patientScene = new Scenes.WizardScene('patient', step1, step2, step3, step4)
const doctorScene = new Scenes.WizardScene('doctor', step1, step2, step3, step4)

// Criar stage e registrar cenas
const stage = new Scenes.Stage([configScene, patientScene, doctorScene])

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.use(session())
bot.use(stage.middleware())

// Menu inline principal
const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('⚙️ Configuração do app', 'menu_config')],
  [Markup.button.callback('👨‍👩‍👧 Cadastro de pacientes', 'menu_patient')],
  [Markup.button.callback('👨‍⚕️ Cadastro de médicos', 'menu_doctor')],
])

// Callbacks para navegar entre cenas e voltar ao menu
bot.action('menu_config', ctx => { ... })
bot.action('menu_patient', ctx => { ... })
bot.action('menu_doctor', ctx => { ... })
bot.action('back_to_menu', ctx => { ... })

bot.start((ctx) => ctx.reply('Bem-vindo! Escolha uma opção:', mainMenu))
bot.command('menu', (ctx) => ctx.reply('Menu principal:', mainMenu))

bot.launch()
```

---

**Variáveis de ambiente (.env):**

```
BOT_TOKEN=seu_token_aqui
REDIS_URL=redis://localhost:6379
```

---

**Objetivo final:**
Ter um bot interativo, modular e persistente que permita diferentes tipos de cadastro e configurações, com navegação fácil e dados armazenados de forma confiável no Redis.

---

Quer que eu gere o código completo e organizado desse projeto com arquivos separados, validação e deploy-ready?
Ou prefere que eu explique algum ponto específico?


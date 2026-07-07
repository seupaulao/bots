require('dotenv').config(); // <-- adicionado

const { Telegraf, Scenes, Markup } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

//https://core.telegram.org/bots/api
bot.use(session());

function getUsuario() {
    return "admin";
}

let usuarioSelecionado = getUsuario();

async function comandos(ctx, mensagem) { 
    ctx.session = null;
    if (usuarioSelecionado == 'paciente') {
        await ctx.reply(mensagem, Markup.inlineKeyboard([
           [Markup.button.callback('Agendar um atendimento', 'opagendar')],
           [Markup.button.callback('Cancelar um atendimento', 'opcancelaragendar')],
           [Markup.button.callback('Ver meu atendimento', 'opveratendimento')],
        ]));
    } else if (usuarioSelecionado == 'admin') {
        await ctx.reply(mensagem, Markup.inlineKeyboard([
           [Markup.button.callback('Gerenciar Profissionais', 'opadmgerenciarprof')],
           [Markup.button.callback('Gerenciar Admin', 'opadmgerenciar')],
           [Markup.button.callback('Gerenciar Pacientes', 'opadmgerenciarpac')],
           [Markup.button.callback('Ver a agenda de atendimentos', 'opadmavergenda')],
           [Markup.button.callback('Gerar formulário de atendimento presencial', 'opadmgerar')],
           [Markup.button.callback('Listar atendimentos do dia', 'opadmlistaatenddia')],
           [Markup.button.callback('Listar todos os pacientes', 'opadmlistarpac')],
           [Markup.button.callback('Listar pacientes por profissional', 'opadmlistarpacprof')],
           [Markup.button.callback('Listar atendimentos realizados por evento', 'opadmatendevento')],
           [Markup.button.callback('Verificar movimentação de atendimentos do dia', 'opadmverificar')],
           [Markup.button.callback('Notificação', 'opadmnotificar')],
        
        ]));  
    } else {
        await ctx.reply(mensagem, Markup.inlineKeyboard([
           [Markup.button.callback('Laudar paciente', 'oplaudar')],
           [Markup.button.callback('Preencher anamnese', 'opanamnese')],
           [Markup.button.callback('Historico do paciente', 'ophistpaciente')],        
        ]));   
    }
}

const cenaAgendar = new Scenes.WizardScene('cenaAgendar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
  async (ctx) => {
    ctx.wizard.state.nome = ctx.message.text
    await ctx.reply(`Olá, ${ctx.message.text}! Qual a seu email`)
    return ctx.scene.next()
  },
    async (ctx) => {
    ctx.wizard.state.email = ctx.message.text
    await ctx.reply(`Agora preciso de sua Data de Nascimento`)
    return ctx.scene.next()
  },
  async (ctx) => {
    ctx.wizard.state.nascimento = ctx.message.text
    await ctx.reply(`Digite o seu telefone com DDD por favor`)
    return ctx.scene.next()
  },
  async (ctx) => {
    ctx.wizard.state.telefone = ctx.message.text
    await ctx.reply(`Qual especialidade deseja consulta?`)
    //interessante apresentar um menu de especialidades do dia do evento
    return ctx.scene.next()
  },
  async (ctx) => {
    ctx.wizard.state.especialidade = ctx.message.text
    //mostrar todos os
    const nmProfissional = await calcularProfissional(); 
    await ctx.reply(`A especialidade foi ${ctx.message.text} profissional ${nmProfissional}`)
    const dataHorario = await calcularDataHorarioAtendimento();
    await ctx.reply(`O atendimento sera ${dataHorario}`) 
    return ctx.scene.leave()
  },

);

const cenaCancelarAgendar = new Scenes.WizardScene('cenaCancelarAgendar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);

const cenaVerAtendimento = new Scenes.WizardScene('cenaVerAtendimento',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
//
const cenaLaudar = new Scenes.WizardScene('cenaLaudar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaAnamnese = new Scenes.WizardScene('cenaAnamnese',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaHistPac = new Scenes.WizardScene('cenaHistPac',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);

//

const cenaGerenciarProf = new Scenes.WizardScene('cenaGerenciarProf',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaGerenciar = new Scenes.WizardScene('cenaGerenciar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaGerenciarPac = new Scenes.WizardScene('cenaGerenciarPac',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaVerAgenda = new Scenes.WizardScene('cenaVerAgenda',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaGerar = new Scenes.WizardScene('cenaGerar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaAtendDia = new Scenes.WizardScene('cenaAtendDia',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaListarPac = new Scenes.WizardScene('cenaListarPac',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaListarPacProf = new Scenes.WizardScene('cenaListarPacProf',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaAtendEvento = new Scenes.WizardScene('cenaAtendEvento',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaVerificar = new Scenes.WizardScene('cenaVerificar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);
const cenaNotificar = new Scenes.WizardScene('cenaNotificar',
  async (ctx) => {
    await ctx.reply('Qual seu nome?')
    return ctx.wizard.next()
  },
);



//fazer as outras cenas


// Criar stage e registrar cenas // colocar todas as cenas
const stage = new Scenes.Stage([cenaAgendar, cenaCancelarAgendar, cenaVerAtendimento, cenaLaudar, cenaAnamnese, cenaHistPac,
cenaGerenciarProf, cenaGerenciar, cenaGerenciarPac, cenaVerAgenda, cenaGerar, cenaAtendDia, cenaListarPac, cenaListarPacProf
cenaAtendEvento, cenaVerificar, cenaNotificar]);

// Callbacks para navegar entre cenas e voltar ao menu - colocar todas as cenas
bot.action('opagendar', ctx => ctx.scene.enter('cenaAgendar'))
bot.action('opcancelaragendar', ctx => ctx.scene.enter('cenaCancelarAgendar'))
bot.action('opveratendimento', ctx => ctx.scene.enter('cenaVerAtendimento'))

bot.action('oplaudar', ctx => ctx.scene.enter('cenaLaudar'))
bot.action('opanamnese', ctx => ctx.scene.enter('cenaAnamnese'))
bot.action('ophistpaciente', ctx => ctx.scene.enter('cenaHistPac'))

bot.action('opadmgerenciarprof', ctx => ctx.scene.enter('cenaGerenciarProf'))
bot.action('opadmgerenciar', ctx => ctx.scene.enter('cenaGerenciar'))
bot.action('opadmgerenciarpac', ctx => ctx.scene.enter('cenaGerenciarPac'))
bot.action('opadmavergenda', ctx => ctx.scene.enter('cenaVerAgenda'))
bot.action('opadmgerar', ctx => ctx.scene.enter('cenaGerar'))
bot.action('opadmlistaatenddia', ctx => ctx.scene.enter('cenaAtendDia'))
bot.action('opadmlistarpac', ctx => ctx.scene.enter('cenaListarPac'))
bot.action('opadmlistarpacprof', ctx => ctx.scene.enter('cenaListarPacProf'))
bot.action('opadmatendevento', ctx => ctx.scene.enter('cenaAtendEvento'))
bot.action('opadmverificar', ctx => ctx.scene.enter('cenaVerificar'))
bot.action('opadmnotificar', ctx => ctx.scene.enter('cenaNotificar'))

// Middleware stage para gerenciar cenas
bot.use(stage.middleware())

bot.start((ctx)=>comandos(ctx, 'Bem-vindo ao Atendimento Clínico'));

bot.command('menu', (ctx) => comandos(ctx, 'Bem-vindo ao Atendimento Clínico'));

bot.launch();

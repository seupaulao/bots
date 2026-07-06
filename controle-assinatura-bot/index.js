const { Telegraf } = require('telegraf');

const token = process.env.CONTROLEASSINATURABOT;
const backendUrl = process.env.BACKEND_URL || 'http://controle-assinaturas-backend:8000';

if (!token) {
  console.error('CONTROLE_ASSINATURA_BOT não foi definido. Use .env ou defina a variável de ambiente CONTROLE_ASSINATURA_BOT.');
  process.exit(1);
}

const bot = new Telegraf(token);

async function fetchWelcomeMessage() {
  const response = await fetch(`${backendUrl}/`);
  if (!response.ok) {
    throw new Error(`Falha na requisição HTTP ${response.status}`);
  }
  const payload = await response.json();
  return payload.message || 'Bem-vindo ao Programa de Controle de Assinatura';
}

bot.start(async (ctx) => {
  try {
    const message = await fetchWelcomeMessage();
    await ctx.reply(message);
  } catch (error) {
    console.error(error);
    await ctx.reply('Não foi possível obter a mensagem de boas-vindas do serviço.');
  }
});

bot.command('welcome', async (ctx) => {
  try {
    const message = await fetchWelcomeMessage();
    await ctx.reply(message);
  } catch (error) {
    console.error(error);
    await ctx.reply('Não foi possível obter a mensagem de boas-vindas do serviço.');
  }
});

bot.launch().then(() => {
  console.log('Bot de controle de assinaturas rodando.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

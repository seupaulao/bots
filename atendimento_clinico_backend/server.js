require('dotenv').config();
const buildApp = require('./src/app');

const start = async () => {
  const app = buildApp();
  try {
    await app.listen({ port: Number(process.env.PORT) || 8000, host: '0.0.0.0' });
    console.log(`Servidor rodando na porta ${process.env.PORT || 8000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

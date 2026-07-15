const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

prisma.$connect().catch((err) => {
  console.error('Erro ao conectar ao banco de dados:', err);
  process.exit(-1);
});

module.exports = prisma;

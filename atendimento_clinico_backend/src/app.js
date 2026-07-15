const fastify = require('fastify');
const cors = require('@fastify/cors');
const fjwt = require('@fastify/jwt');
const prisma = require('./config/database');
const bcrypt = require('bcrypt');

function buildApp() {
  const app = fastify({ logger: true });

  app.register(cors);
  app.register(fjwt, { secret: process.env.JWT_SECRET || 'secret-dev' });

  app.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'Não autorizado' });
    }
  });

  app.decorate('authorize', (...perfis) => {
    return async (request, reply) => {
      const { perfil } = request.user;
      if (!perfis.includes(perfil)) {
        return reply.status(403).send({ error: 'Acesso negado' });
      }
    };
  });

  app.decorate('seed', async () => {
    const total = await prisma.seguranca.count();
    if (total === 0) {
      const user = await prisma.usuarios.upsert({
        where: { cpf: '81784244368' },
        update: {},
        create: {
          nome: 'PAULO CESAR SILVA JUNIOR',
          cpf: '81784244368',
          email: 'seupaulao@gmail.com',
          telegram: '+5585985907180',
        },
      });
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.seguranca.upsert({
        where: { id_usuario: user.id },
        update: {},
        create: {
          id_usuario: user.id,
          perfil: 'admin',
          senha: hash,
        },
      });
      console.log('Usuário admin seedado com sucesso');
    }
  });

  app.register(require('./routes/auth'), { prefix: '/api/auth' });
  app.register(require('./routes/especialidades'), { prefix: '/api/especialidades' });
  app.register(require('./routes/usuarios'), { prefix: '/api/usuarios' });
  app.register(require('./routes/campanhas'), { prefix: '/api/campanhas' });
  app.register(require('./routes/atendimentos'), { prefix: '/api/atendimentos' });
  app.register(require('./routes/anamneses'), { prefix: '/api/anamneses' });

  app.post('/api/seed', async (request, reply) => {
    await app.seed();
    return { message: 'Seed executado' };
  });

  app.ready().then(() => app.seed());

  return app;
}

module.exports = buildApp;

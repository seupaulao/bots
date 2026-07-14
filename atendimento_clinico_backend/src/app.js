const fastify = require('fastify');
const cors = require('@fastify/cors');
const fjwt = require('@fastify/jwt');
const pool = require('./config/database');

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
    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM seguranca');
    if (rows[0].total === 0) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO seguranca (id_usuario, perfil, senha) VALUES ($1, $2, $3)`,
        [1, 'admin', hash]
      );
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

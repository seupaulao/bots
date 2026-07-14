const fp = require('fastify-plugin');

async function authPlugin(app) {
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
}

module.exports = fp(authPlugin);

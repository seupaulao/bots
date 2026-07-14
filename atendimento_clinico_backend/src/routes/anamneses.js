const ctrl = require('../controllers/anamnesesController');

async function anamnesesRoutes(app) {
  app.get('/usuario/:id', { onRequest: [app.authenticate] }, ctrl.list);
  app.get('/atendimento/:id', { onRequest: [app.authenticate] }, ctrl.listByAtendimento);
  app.post('/atendimento/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor', 'profissional')] }, ctrl.create);
}

module.exports = anamnesesRoutes;

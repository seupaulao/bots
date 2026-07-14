const ctrl = require('../controllers/atendimentosController');

async function atendimentosRoutes(app) {
  app.get('/', { onRequest: [app.authenticate] }, ctrl.list);
  app.post('/', { onRequest: [app.authenticate] }, ctrl.create);
  app.post('/continuar', { onRequest: [app.authenticate] }, ctrl.continuar);
  app.put('/:id/iniciar', { onRequest: [app.authenticate, app.authorize('admin', 'gestor', 'profissional')] }, ctrl.iniciar);
  app.put('/:id/finalizar', { onRequest: [app.authenticate, app.authorize('admin', 'gestor', 'profissional')] }, ctrl.finalizar);
  app.put('/:id/desistencia', { onRequest: [app.authenticate, app.authorize('admin', 'gestor', 'profissional')] }, ctrl.desistencia);
  app.put('/:id/realocar', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.realocar);
}

module.exports = atendimentosRoutes;

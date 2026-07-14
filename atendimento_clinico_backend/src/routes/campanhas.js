const ctrl = require('../controllers/campanhasController');

async function campanhasRoutes(app) {
  app.get('/', { onRequest: [app.authenticate] }, ctrl.list);
  app.get('/:id', { onRequest: [app.authenticate] }, ctrl.getById);
  app.post('/', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.create);
  app.put('/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.update);
  app.delete('/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.remove);
  app.post('/:id/profissionais', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.addProfissional);
  app.delete('/:id/profissionais/:idVinc', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.removeProfissional);
  app.post('/:id/disparar', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.disparar);
  app.post('/:id/inscricao', ctrl.inscricao);
  app.get('/:id/horarios', ctrl.horariosDisponiveis);
}

module.exports = campanhasRoutes;

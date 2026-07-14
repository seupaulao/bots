const ctrl = require('../controllers/especialidadesController');

async function especialidadesRoutes(app) {
  app.get('/', { onRequest: [app.authenticate] }, ctrl.list);
  app.post('/', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.create);
  app.put('/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.update);
  app.delete('/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.remove);
}

module.exports = especialidadesRoutes;

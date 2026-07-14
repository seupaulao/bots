const ctrl = require('../controllers/usuariosController');

async function usuariosRoutes(app) {
  app.get('/', { onRequest: [app.authenticate] }, ctrl.list);
  app.get('/:id', { onRequest: [app.authenticate] }, ctrl.getById);
  app.post('/', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.create);
  app.put('/:id', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.update);
  app.post('/:id/especialidades', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.addEspecialidade);
  app.delete('/:id/especialidades/:idEsp', { onRequest: [app.authenticate, app.authorize('admin', 'gestor')] }, ctrl.removeEspecialidade);
}

module.exports = usuariosRoutes;

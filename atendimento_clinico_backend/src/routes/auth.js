const { login } = require('../controllers/authController');

async function authRoutes(app) {
  app.post('/login', login);
}

module.exports = authRoutes;

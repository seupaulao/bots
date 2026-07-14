const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function login(request, reply) {
  const { login: loginInput, senha } = request.body;

  if (!loginInput || !senha) {
    return reply.status(400).send({ error: 'Login e senha são obrigatórios' });
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.nome, u.cpf, u.email, s.perfil, s.senha
     FROM usuarios u
     JOIN seguranca s ON s.id_usuario = u.id
     WHERE u.cpf = $1 OR u.email = $1`,
    [loginInput]
  );

  if (rows.length === 0) {
    return reply.status(401).send({ error: 'Credenciais inválidas' });
  }

  const user = rows[0];
  const senhaValida = await bcrypt.compare(senha, user.senha);

  if (!senhaValida) {
    return reply.status(401).send({ error: 'Credenciais inválidas' });
  }

  const token = reply.jwtSign({
    id: user.id,
    nome: user.nome,
    perfil: user.perfil,
  }, { expiresIn: '24h' });

  return { token, usuario: { id: user.id, nome: user.nome, perfil: user.perfil } };
}

module.exports = { login };

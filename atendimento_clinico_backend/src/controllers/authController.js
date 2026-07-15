const prisma = require('../config/database');
const bcrypt = require('bcrypt');

async function login(request, reply) {
  const { login: loginInput, senha } = request.body;

  if (!loginInput || !senha) {
    return reply.status(400).send({ error: 'Login e senha são obrigatórios' });
  }

  const user = await prisma.usuarios.findFirst({
    where: {
      OR: [{ cpf: loginInput }, { email: loginInput }],
    },
    include: { seguranca: true },
  });

  if (!user || !user.seguranca) {
    return reply.status(401).send({ error: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, user.seguranca.senha);

  if (!senhaValida) {
    return reply.status(401).send({ error: 'Credenciais inválidas' });
  }

  const token = reply.jwtSign({
    id: user.id,
    nome: user.nome,
    perfil: user.seguranca.perfil,
  }, { expiresIn: '24h' });

  return { token, usuario: { id: user.id, nome: user.nome, perfil: user.seguranca.perfil } };
}

module.exports = { login };

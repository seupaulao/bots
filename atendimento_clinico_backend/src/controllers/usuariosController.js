const prisma = require('../config/database');
const bcrypt = require('bcrypt');

async function list(request, reply) {
  const { perfil } = request.query;
  const where = perfil
    ? { seguranca: { perfil } }
    : {};

  const rows = await prisma.usuarios.findMany({
    where,
    include: { seguranca: { select: { perfil: true } } },
    orderBy: { nome: 'asc' },
  });

  return rows.map(u => ({
    id: u.id,
    nome: u.nome,
    cpf: u.cpf,
    email: u.email,
    telefone: u.telefone,
    whatsapp: u.whatsapp,
    telegram: u.telegram,
    nascimento: u.nascimento,
    conselho: u.conselho,
    dt_inicio: u.dt_inicio,
    dt_fim: u.dt_fim,
    perfil: u.seguranca?.perfil || null,
  }));
}

async function getById(request, reply) {
  const { id } = request.params;

  const row = await prisma.usuarios.findUnique({
    where: { id: Number(id) },
    include: {
      seguranca: { select: { perfil: true } },
      usuarioEspecialidade: {
        include: { especialidade: { select: { id: true, nome: true } } },
      },
    },
  });

  if (!row) return reply.status(404).send({ error: 'Usuário não encontrado' });

  return {
    ...row,
    perfil: row.seguranca?.perfil || null,
    seguranca: undefined,
    usuarioEspecialidade: undefined,
    especialidades: row.usuarioEspecialidade.map(ue => ue.especialidade),
  };
}

async function create(request, reply) {
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento, conselho, perfil, senha } = request.body;

  if (!nome || !cpf) return reply.status(400).send({ error: 'Nome e CPF são obrigatórios' });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.usuarios.create({
        data: { nome, cpf, email, telefone, whatsapp, telegram, nascimento: nascimento || null, conselho: conselho || null },
      });

      if (perfil && senha) {
        const hash = await bcrypt.hash(senha, 10);
        await tx.seguranca.create({
          data: { id_usuario: user.id, perfil, senha: hash },
        });
      }

      return user;
    });

    return reply.status(201).send(result);
  } catch (err) {
    if (err.code === 'P2002') return reply.status(409).send({ error: 'CPF já cadastrado' });
    throw err;
  }
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento, conselho, dt_inicio, dt_fim } = request.body;

  const data = {};
  if (nome !== undefined) data.nome = nome;
  if (cpf !== undefined) data.cpf = cpf;
  if (email !== undefined) data.email = email;
  if (telefone !== undefined) data.telefone = telefone;
  if (whatsapp !== undefined) data.whatsapp = whatsapp;
  if (telegram !== undefined) data.telegram = telegram;
  if (nascimento !== undefined) data.nascimento = nascimento;
  if (conselho !== undefined) data.conselho = conselho;
  if (dt_inicio !== undefined) data.dt_inicio = dt_inicio;
  if (dt_fim !== undefined) data.dt_fim = dt_fim;

  if (Object.keys(data).length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });

  try {
    const row = await prisma.usuarios.update({
      where: { id: Number(id) },
      data,
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') return reply.status(404).send({ error: 'Usuário não encontrado' });
    throw err;
  }
}

async function addEspecialidade(request, reply) {
  const { id } = request.params;
  const { id_especialidade } = request.body;

  if (!id_especialidade) return reply.status(400).send({ error: 'id_especialidade é obrigatório' });

  try {
    const row = await prisma.usuario_especialidade.create({
      data: { id_usuario: Number(id), id_especialidade: Number(id_especialidade) },
    });
    return reply.status(201).send(row);
  } catch (err) {
    if (err.code === 'P2002') return reply.status(409).send({ error: 'Vínculo já existe' });
    throw err;
  }
}

async function removeEspecialidade(request, reply) {
  const { id, idEsp } = request.params;
  try {
    await prisma.usuario_especialidade.deleteMany({
      where: { id_usuario: Number(id), id_especialidade: Number(idEsp) },
    });
    return reply.status(204).send();
  } catch (err) {
    return reply.status(404).send({ error: 'Vínculo não encontrado' });
  }
}

module.exports = { list, getById, create, update, addEspecialidade, removeEspecialidade };

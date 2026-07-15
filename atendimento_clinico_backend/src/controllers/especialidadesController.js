const prisma = require('../config/database');

async function list(request, reply) {
  const rows = await prisma.especialidades.findMany({ orderBy: { nome: 'asc' } });
  return rows;
}

async function create(request, reply) {
  const { nome } = request.body;
  if (!nome) return reply.status(400).send({ error: 'Nome é obrigatório' });

  try {
    const row = await prisma.especialidades.create({ data: { nome } });
    return reply.status(201).send(row);
  } catch (err) {
    if (err.code === 'P2002') return reply.status(409).send({ error: 'Especialidade já existe' });
    throw err;
  }
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome } = request.body;
  if (!nome) return reply.status(400).send({ error: 'Nome é obrigatório' });

  try {
    const row = await prisma.especialidades.update({
      where: { id: Number(id) },
      data: { nome },
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') return reply.status(404).send({ error: 'Especialidade não encontrada' });
    if (err.code === 'P2002') return reply.status(409).send({ error: 'Especialidade já existe' });
    throw err;
  }
}

async function remove(request, reply) {
  const { id } = request.params;
  try {
    await prisma.especialidades.delete({ where: { id: Number(id) } });
    return reply.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return reply.status(404).send({ error: 'Especialidade não encontrada' });
    throw err;
  }
}

module.exports = { list, create, update, remove };

const prisma = require('../config/database');

async function list(request, reply) {
  const rows = await prisma.campanhas.findMany({
    include: {
      _count: { select: { campanhaProfissionalEspecialidade: true } },
    },
    orderBy: [{ data: 'desc' }, { hora: 'desc' }],
  });

  return rows.map(c => ({
    ...c,
    total_profissionais: c._count.campanhaProfissionalEspecialidade,
    _count: undefined,
  }));
}

async function getById(request, reply) {
  const { id } = request.params;

  const row = await prisma.campanhas.findUnique({
    where: { id: Number(id) },
    include: {
      campanhaProfissionalEspecialidade: {
        include: {
          usuario: { select: { nome: true } },
          especialidade: { select: { nome: true } },
        },
      },
    },
  });

  if (!row) return reply.status(404).send({ error: 'Campanha não encontrada' });

  return {
    ...row,
    campanhaProfissionalEspecialidade: undefined,
    profissionais: row.campanhaProfissionalEspecialidade.map(cpe => ({
      id: cpe.id,
      id_usuario: cpe.id_usuario,
      nome_profissional: cpe.usuario.nome,
      id_especialidade: cpe.id_especialidade,
      nome_especialidade: cpe.especialidade.nome,
      identificador_acesso: cpe.identificador_acesso,
    })),
  };
}

async function create(request, reply) {
  const { nome, data, hora } = request.body;
  if (!nome || !data || !hora) {
    return reply.status(400).send({ error: 'nome, data e hora são obrigatórios' });
  }

  const row = await prisma.campanhas.create({
    data: { nome, data: new Date(data), hora },
  });
  return reply.status(201).send(row);
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome, data, hora } = request.body;

  const dataToUpdate = {};
  if (nome !== undefined) dataToUpdate.nome = nome;
  if (data !== undefined) dataToUpdate.data = new Date(data);
  if (hora !== undefined) dataToUpdate.hora = hora;

  if (Object.keys(dataToUpdate).length === 0) {
    return reply.status(400).send({ error: 'Nenhum campo para atualizar' });
  }

  try {
    const row = await prisma.campanhas.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') return reply.status(404).send({ error: 'Campanha não encontrada' });
    throw err;
  }
}

async function remove(request, reply) {
  const { id } = request.params;
  try {
    await prisma.campanhas.delete({ where: { id: Number(id) } });
    return reply.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return reply.status(404).send({ error: 'Campanha não encontrada' });
    throw err;
  }
}

async function addProfissional(request, reply) {
  const { id } = request.params;
  const { id_usuario, id_especialidade } = request.body;

  if (!id_usuario || !id_especialidade) {
    return reply.status(400).send({ error: 'id_usuario e id_especialidade são obrigatórios' });
  }

  try {
    const row = await prisma.campanha_profissional_especialidade.create({
      data: {
        id_campanha: Number(id),
        id_usuario: Number(id_usuario),
        id_especialidade: Number(id_especialidade),
      },
    });
    return reply.status(201).send(row);
  } catch (err) {
    if (err.code === 'P2002') {
      return reply.status(409).send({ error: 'Profissional já vinculado a esta especialidade na campanha' });
    }
    throw err;
  }
}

async function removeProfissional(request, reply) {
  const { id, idVinc } = request.params;
  try {
    await prisma.campanha_profissional_especialidade.deleteMany({
      where: { id: Number(idVinc), id_campanha: Number(id) },
    });
    return reply.status(204).send();
  } catch (err) {
    return reply.status(404).send({ error: 'Vínculo não encontrado' });
  }
}

async function disparar(request, reply) {
  const { id } = request.params;

  const rows = await prisma.campanha_profissional_especialidade.findMany({
    where: { id_campanha: Number(id) },
    include: {
      campanha: { select: { nome: true } },
      usuario: { select: { nome: true, email: true, whatsapp: true, telegram: true } },
      especialidade: { select: { nome: true } },
    },
  });

  return {
    message: `Notificações disparadas para ${rows.length} profissional(is)`,
    profissionais: rows.map(r => ({
      campanha: r.campanha.nome,
      nome: r.usuario.nome,
      email: r.usuario.email,
      whatsapp: r.usuario.whatsapp,
      telegram: r.usuario.telegram,
      identificador_acesso: r.identificador_acesso,
      especialidade: r.especialidade.nome,
    })),
  };
}

async function inscricao(request, reply) {
  const { id } = request.params;
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento } = request.body;

  if (!nome || !cpf) {
    return reply.status(400).send({ error: 'nome e cpf são obrigatórios' });
  }

  const campanha = await prisma.campanhas.findUnique({ where: { id: Number(id) } });
  if (!campanha) {
    return reply.status(404).send({ error: 'Campanha não encontrada' });
  }

  let existingUser = await prisma.usuarios.findUnique({ where: { cpf } });

  if (!existingUser) {
    existingUser = await prisma.usuarios.create({
      data: { nome, cpf, email, telefone, whatsapp, telegram, nascimento: nascimento || null },
    });
  }

  return reply.status(201).send({
    message: 'Inscrição realizada com sucesso',
    id_campanha: Number(id),
    id_paciente: existingUser.id,
  });
}

async function horariosDisponiveis(request, reply) {
  const { id } = request.params;

  const rows = await prisma.campanha_profissional_especialidade.findMany({
    where: { id_campanha: Number(id) },
    include: {
      campanha: { select: { data: true, hora: true } },
      usuario: { select: { nome: true } },
      especialidade: { select: { nome: true } },
    },
    orderBy: [{ usuario: { nome: 'asc' } }, { especialidade: { nome: 'asc' } }],
  });

  return rows.map(r => ({
    data: r.campanha.data,
    hora: r.campanha.hora,
    id_profissional_especialidade: r.id,
    profissional: r.usuario.nome,
    especialidade: r.especialidade.nome,
  }));
}

module.exports = {
  list, getById, create, update, remove,
  addProfissional, removeProfissional, disparar,
  inscricao, horariosDisponiveis,
};

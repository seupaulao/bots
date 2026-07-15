const prisma = require('../config/database');

async function list(request, reply) {
  const { status: filterStatus, campanha, paciente, profissional } = request.query;

  const where = {};

  if (filterStatus) where.status = filterStatus;
  if (campanha) where.id_campanha = Number(campanha);
  if (paciente) where.id_usuario_paciente = Number(paciente);
  if (profissional) {
    where.profissionalEspecialidade = { id_usuario: Number(profissional) };
  }

  const rows = await prisma.atendimentos.findMany({
    where,
    include: {
      usuarioPaciente: { select: { nome: true } },
      profissionalEspecialidade: {
        include: {
          usuario: { select: { nome: true } },
          especialidade: { select: { nome: true } },
        },
      },
      campanha: { select: { nome: true } },
    },
    orderBy: { data_hora_atendimento: 'asc' },
  });

  return rows.map(a => ({
    ...a,
    usuarioPaciente: undefined,
    profissionalEspecialidade: undefined,
    campanha: undefined,
    nome_paciente: a.usuarioPaciente.nome,
    nome_profissional: a.profissionalEspecialidade.usuario.nome,
    nome_especialidade: a.profissionalEspecialidade.especialidade.nome,
    nome_campanha: a.campanha.nome,
  }));
}

async function create(request, reply) {
  const { data_hora_atendimento, id_campanha, id_usuario_paciente, id_profissional_especialidade } = request.body;

  if (!data_hora_atendimento || !id_campanha || !id_usuario_paciente || !id_profissional_especialidade) {
    return reply.status(400).send({
      error: 'data_hora_atendimento, id_campanha, id_usuario_paciente e id_profissional_especialidade são obrigatórios',
    });
  }

  const conflito = await prisma.atendimentos.findFirst({
    where: {
      id_profissional_especialidade: Number(id_profissional_especialidade),
      data_hora_atendimento: new Date(data_hora_atendimento),
      status: { notIn: ['cancelado', 'desistencia'] },
    },
  });

  if (conflito) {
    return reply.status(409).send({ error: 'Horário já agendado para este profissional' });
  }

  const row = await prisma.atendimentos.create({
    data: {
      data_hora_atendimento: new Date(data_hora_atendimento),
      id_campanha: Number(id_campanha),
      id_usuario_paciente: Number(id_usuario_paciente),
      id_profissional_especialidade: Number(id_profissional_especialidade),
    },
  });

  return reply.status(201).send(row);
}

async function iniciar(request, reply) {
  const { id } = request.params;

  try {
    const row = await prisma.atendimentos.update({
      where: { id: Number(id), status: 'agendado' },
      data: { status: 'em_andamento' },
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') {
      return reply.status(400).send({ error: 'Atendimento não encontrado ou não está agendado' });
    }
    throw err;
  }
}

async function finalizar(request, reply) {
  const { id } = request.params;

  try {
    const row = await prisma.atendimentos.update({
      where: { id: Number(id), status: 'em_andamento' },
      data: { status: 'concluido', foi_concluido: true },
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') {
      return reply.status(400).send({ error: 'Atendimento não encontrado ou não está em andamento' });
    }
    throw err;
  }
}

async function desistencia(request, reply) {
  const { id } = request.params;

  try {
    const row = await prisma.atendimentos.update({
      where: { id: Number(id), status: 'agendado' },
      data: { status: 'desistencia', houve_desistencia: true },
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') {
      return reply.status(400).send({ error: 'Atendimento não encontrado ou não está agendado' });
    }
    throw err;
  }
}

async function realocar(request, reply) {
  const { id } = request.params;
  const { data_hora_atendimento } = request.body;

  if (!data_hora_atendimento) {
    return reply.status(400).send({ error: 'data_hora_atendimento é obrigatório' });
  }

  try {
    const row = await prisma.atendimentos.update({
      where: { id: Number(id), status: { in: ['agendado', 'desistencia'] } },
      data: { data_hora_atendimento: new Date(data_hora_atendimento) },
    });
    return row;
  } catch (err) {
    if (err.code === 'P2025') {
      return reply.status(400).send({ error: 'Atendimento não encontrado ou não pode ser realocado' });
    }
    throw err;
  }
}

async function continuar(request, reply) {
  const { id_campanha, id_usuario_paciente, para_outra_pessoa, dados_outra_pessoa } = request.body;

  if (para_outra_pessoa && dados_outra_pessoa) {
    const { nome, cpf, email, telefone, whatsapp, telegram, nascimento } = dados_outra_pessoa;

    if (!nome || !cpf) {
      return reply.status(400).send({ error: 'nome e cpf da outra pessoa são obrigatórios' });
    }

    const existing = await prisma.usuarios.findUnique({ where: { cpf } });
    if (existing) {
      return reply.status(200).send({
        message: 'Pessoa já cadastrada',
        id_paciente: existing.id,
        id_campanha: Number(id_campanha),
      });
    }

    const newUser = await prisma.usuarios.create({
      data: { nome, cpf, email, telefone, whatsapp, telegram, nascimento: nascimento || null },
    });

    return reply.status(201).send({
      message: 'Pessoa cadastrada com sucesso',
      id_paciente: newUser.id,
      id_campanha: Number(id_campanha),
    });
  }

  return reply.status(200).send({
    message: 'Continuar agendando para o mesmo paciente',
    id_paciente: id_usuario_paciente,
    id_campanha: Number(id_campanha),
  });
}

module.exports = { list, create, iniciar, finalizar, desistencia, realocar, continuar };

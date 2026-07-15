const prisma = require('../config/database');

async function list(request, reply) {
  const { id } = request.params;

  const rows = await prisma.anamneses.findMany({
    where: {
      OR: [
        { id_paciente: Number(id) },
        { profissionalEspecialidade: { id_usuario: Number(id) } },
      ],
    },
    include: {
      paciente: { select: { nome: true } },
      profissionalEspecialidade: {
        include: {
          usuario: { select: { nome: true } },
          especialidade: { select: { nome: true } },
        },
      },
    },
    orderBy: { data_criacao: 'desc' },
  });

  return rows.map(a => ({
    ...a,
    paciente: undefined,
    profissionalEspecialidade: undefined,
    nome_paciente: a.paciente.nome,
    nome_profissional: a.profissionalEspecialidade.usuario.nome,
    nome_especialidade: a.profissionalEspecialidade.especialidade.nome,
  }));
}

async function listByAtendimento(request, reply) {
  const { id } = request.params;

  const atd = await prisma.atendimentos.findUnique({
    where: { id: Number(id) },
  });

  if (!atd) return reply.status(404).send({ error: 'Atendimento não encontrado' });

  const rows = await prisma.anamneses.findMany({
    where: {
      id_paciente: atd.id_usuario_paciente,
      id_profissional_especialidade: atd.id_profissional_especialidade,
    },
    include: {
      paciente: { select: { nome: true } },
      profissionalEspecialidade: {
        include: {
          usuario: { select: { nome: true } },
          especialidade: { select: { nome: true } },
        },
      },
    },
    orderBy: { data_criacao: 'desc' },
  });

  return rows.map(a => ({
    ...a,
    paciente: undefined,
    profissionalEspecialidade: undefined,
    nome_paciente: a.paciente.nome,
    nome_profissional: a.profissionalEspecialidade.usuario.nome,
    nome_especialidade: a.profissionalEspecialidade.especialidade.nome,
  }));
}

async function create(request, reply) {
  const { id } = request.params;
  const { tipo, descricao, texto } = request.body;

  if (!tipo || !['exame', 'receita', 'laudo', 'consulta'].includes(tipo)) {
    return reply.status(400).send({ error: 'tipo deve ser exame, receita, laudo ou consulta' });
  }

  const atd = await prisma.atendimentos.findUnique({
    where: { id: Number(id) },
  });

  if (!atd) return reply.status(404).send({ error: 'Atendimento não encontrado' });

  const row = await prisma.anamneses.create({
    data: {
      tipo,
      descricao: descricao || null,
      texto: texto || null,
      id_paciente: atd.id_usuario_paciente,
      id_profissional_especialidade: atd.id_profissional_especialidade,
    },
  });

  return reply.status(201).send(row);
}

module.exports = { list, listByAtendimento, create };

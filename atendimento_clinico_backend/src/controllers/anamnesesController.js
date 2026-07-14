const pool = require('../config/database');

async function list(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(
    `SELECT a.*, u.nome AS nome_paciente, prof.nome AS nome_profissional,
            e.nome AS nome_especialidade
     FROM anamneses a
     JOIN usuarios u ON u.id = a.id_paciente
     JOIN campanha_profissional_especialidade cpe ON cpe.id = a.id_profissional_especialidade
     JOIN usuarios prof ON prof.id = cpe.id_usuario
     JOIN especialidades e ON e.id = cpe.id_especialidade
     WHERE a.id_paciente = $1 OR a.id_profissional_especialidade IN (
       SELECT id FROM campanha_profissional_especialidade WHERE id_usuario = $1
     )
     ORDER BY a.data_criacao DESC`,
    [id]
  );

  return rows;
}

async function listByAtendimento(request, reply) {
  const { id } = request.params; // id do atendimento

  const { rows: atd } = await pool.query(
    'SELECT id_usuario_paciente, id_profissional_especialidade FROM atendimentos WHERE id = $1',
    [id]
  );
  if (atd.length === 0) return reply.status(404).send({ error: 'Atendimento não encontrado' });

  const { rows } = await pool.query(
    `SELECT a.*, u.nome AS nome_paciente, prof.nome AS nome_profissional,
            e.nome AS nome_especialidade
     FROM anamneses a
     JOIN usuarios u ON u.id = a.id_paciente
     JOIN campanha_profissional_especialidade cpe ON cpe.id = a.id_profissional_especialidade
     JOIN usuarios prof ON prof.id = cpe.id_usuario
     JOIN especialidades e ON e.id = cpe.id_especialidade
     WHERE a.id_paciente = $1 AND a.id_profissional_especialidade = $2
     ORDER BY a.data_criacao DESC`,
    [atd[0].id_usuario_paciente, atd[0].id_profissional_especialidade]
  );

  return rows;
}

async function create(request, reply) {
  const { id } = request.params; // id do atendimento
  const { tipo, descricao, texto } = request.body;

  if (!tipo || !['exame', 'receita', 'laudo', 'consulta'].includes(tipo)) {
    return reply.status(400).send({ error: 'tipo deve ser exame, receita, laudo ou consulta' });
  }

  const { rows: atd } = await pool.query(
    'SELECT id_usuario_paciente, id_profissional_especialidade FROM atendimentos WHERE id = $1',
    [id]
  );
  if (atd.length === 0) return reply.status(404).send({ error: 'Atendimento não encontrado' });

  const { rows } = await pool.query(
    `INSERT INTO anamneses (tipo, descricao, texto, id_paciente, id_profissional_especialidade)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tipo, descricao || null, texto || null, atd[0].id_usuario_paciente, atd[0].id_profissional_especialidade]
  );

  return reply.status(201).send(rows[0]);
}

module.exports = { list, listByAtendimento, create };

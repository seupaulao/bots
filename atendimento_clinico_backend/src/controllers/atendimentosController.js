const pool = require('../config/database');

async function list(request, reply) {
  const { status: filterStatus, campanha, paciente, profissional } = request.query;
  let query = `
    SELECT a.*, u.nome AS nome_paciente, prof.nome AS nome_profissional,
           e.nome AS nome_especialidade, c.nome AS nome_campanha
    FROM atendimentos a
    JOIN usuarios u ON u.id = a.id_usuario_paciente
    JOIN campanha_profissional_especialidade cpe ON cpe.id = a.id_profissional_especialidade
    JOIN usuarios prof ON prof.id = cpe.id_usuario
    JOIN especialidades e ON e.id = cpe.id_especialidade
    JOIN campanhas c ON c.id = a.id_campanha
    WHERE 1=1
  `;
  const params = [];
  let idx = 1;

  if (filterStatus) {
    query += ` AND a.status = $${idx++}`;
    params.push(filterStatus);
  }
  if (campanha) {
    query += ` AND a.id_campanha = $${idx++}`;
    params.push(campanha);
  }
  if (paciente) {
    query += ` AND a.id_usuario_paciente = $${idx++}`;
    params.push(paciente);
  }
  if (profissional) {
    query += ` AND cpe.id_usuario = $${idx++}`;
    params.push(profissional);
  }

  query += ' ORDER BY a.data_hora_atendimento';

  const { rows } = await pool.query(query, params);
  return rows;
}

async function create(request, reply) {
  const { data_hora_atendimento, id_campanha, id_usuario_paciente, id_profissional_especialidade } = request.body;

  if (!data_hora_atendimento || !id_campanha || !id_usuario_paciente || !id_profissional_especialidade) {
    return reply.status(400).send({
      error: 'data_hora_atendimento, id_campanha, id_usuario_paciente e id_profissional_especialidade são obrigatórios',
    });
  }

  const { rows: conflito } = await pool.query(
    `SELECT id FROM atendimentos
     WHERE id_profissional_especialidade = $1
       AND data_hora_atendimento = $2
       AND status NOT IN ('cancelado', 'desistencia')`,
    [id_profissional_especialidade, data_hora_atendimento]
  );

  if (conflito.length > 0) {
    return reply.status(409).send({ error: 'Horário já agendado para este profissional' });
  }

  const { rows } = await pool.query(
    `INSERT INTO atendimentos (data_hora_atendimento, id_campanha, id_usuario_paciente, id_profissional_especialidade)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data_hora_atendimento, id_campanha, id_usuario_paciente, id_profissional_especialidade]
  );

  return reply.status(201).send(rows[0]);
}

async function iniciar(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(
    `UPDATE atendimentos SET status = 'em_andamento' WHERE id = $1 AND status = 'agendado' RETURNING *`,
    [id]
  );
  if (rows.length === 0) return reply.status(400).send({ error: 'Atendimento não encontrado ou não está agendado' });
  return rows[0];
}

async function finalizar(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(
    `UPDATE atendimentos SET status = 'concluido', foi_concluido = TRUE WHERE id = $1 AND status = 'em_andamento' RETURNING *`,
    [id]
  );
  if (rows.length === 0) return reply.status(400).send({ error: 'Atendimento não encontrado ou não está em andamento' });
  return rows[0];
}

async function desistencia(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(
    `UPDATE atendimentos SET status = 'desistencia', houve_desistencia = TRUE WHERE id = $1 AND status = 'agendado' RETURNING *`,
    [id]
  );
  if (rows.length === 0) return reply.status(400).send({ error: 'Atendimento não encontrado ou não está agendado' });
  return rows[0];
}

async function realocar(request, reply) {
  const { id } = request.params;
  const { data_hora_atendimento } = request.body;

  if (!data_hora_atendimento) {
    return reply.status(400).send({ error: 'data_hora_atendimento é obrigatório' });
  }

  const { rows } = await pool.query(
    `UPDATE atendimentos SET data_hora_atendimento = $1 WHERE id = $2 AND status IN ('agendado', 'desistencia') RETURNING *`,
    [data_hora_atendimento, id]
  );
  if (rows.length === 0) return reply.status(400).send({ error: 'Atendimento não encontrado ou não pode ser realocado' });
  return rows[0];
}

async function continuar(request, reply) {
  const { id_campanha, id_usuario_paciente, para_outra_pessoa, dados_outra_pessoa } = request.body;

  if (para_outra_pessoa && dados_outra_pessoa) {
    const { nome, cpf, email, telefone, whatsapp, telegram, nascimento } = dados_outra_pessoa;

    if (!nome || !cpf) {
      return reply.status(400).send({ error: 'nome e cpf da outra pessoa são obrigatórios' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM usuarios WHERE cpf = $1', [cpf]);
    if (existing.length > 0) {
      return reply.status(200).send({
        message: 'Pessoa já cadastrada',
        id_paciente: existing[0].id,
        id_campanha: Number(id_campanha),
      });
    }

    const { rows: newUser } = await pool.query(
      `INSERT INTO usuarios (nome, cpf, email, telefone, whatsapp, telegram, nascimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nome, cpf, email, telefone, whatsapp, telegram, nascimento || null]
    );

    return reply.status(201).send({
      message: 'Pessoa cadastrada com sucesso',
      id_paciente: newUser[0].id,
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

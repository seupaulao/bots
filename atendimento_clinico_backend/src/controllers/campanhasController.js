const pool = require('../config/database');

async function list(request, reply) {
  const { rows } = await pool.query(`
    SELECT c.*, COUNT(cpe.id)::int AS total_profissionais
    FROM campanhas c
    LEFT JOIN campanha_profissional_especialidade cpe ON cpe.id_campanha = c.id
    GROUP BY c.id
    ORDER BY c.data DESC, c.hora DESC
  `);
  return rows;
}

async function getById(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(`
    SELECT c.*,
           COALESCE(json_agg(json_build_object(
             'id', cpe.id,
             'id_usuario', cpe.id_usuario,
             'nome_profissional', u.nome,
             'id_especialidade', cpe.id_especialidade,
             'nome_especialidade', e.nome,
             'identificador_acesso', cpe.identificador_acesso
           )) FILTER (WHERE cpe.id IS NOT NULL), '[]') AS profissionais
    FROM campanhas c
    LEFT JOIN campanha_profissional_especialidade cpe ON cpe.id_campanha = c.id
    LEFT JOIN usuarios u ON u.id = cpe.id_usuario
    LEFT JOIN especialidades e ON e.id = cpe.id_especialidade
    WHERE c.id = $1
    GROUP BY c.id
  `, [id]);

  if (rows.length === 0) return reply.status(404).send({ error: 'Campanha não encontrada' });
  return rows[0];
}

async function create(request, reply) {
  const { nome, data, hora } = request.body;
  if (!nome || !data || !hora) {
    return reply.status(400).send({ error: 'nome, data e hora são obrigatórios' });
  }

  const { rows } = await pool.query(
    'INSERT INTO campanhas (nome, data, hora) VALUES ($1, $2, $3) RETURNING *',
    [nome, data, hora]
  );
  return reply.status(201).send(rows[0]);
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome, data, hora } = request.body;

  const fields = [];
  const params = [];
  let idx = 1;

  if (nome !== undefined) { fields.push(`nome = $${idx++}`); params.push(nome); }
  if (data !== undefined) { fields.push(`data = $${idx++}`); params.push(data); }
  if (hora !== undefined) { fields.push(`hora = $${idx++}`); params.push(hora); }

  if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE campanhas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (rows.length === 0) return reply.status(404).send({ error: 'Campanha não encontrada' });
  return rows[0];
}

async function remove(request, reply) {
  const { id } = request.params;
  const { rowCount } = await pool.query('DELETE FROM campanhas WHERE id = $1', [id]);
  if (rowCount === 0) return reply.status(404).send({ error: 'Campanha não encontrada' });
  return reply.status(204).send();
}

async function addProfissional(request, reply) {
  const { id } = request.params;
  const { id_usuario, id_especialidade } = request.body;

  if (!id_usuario || !id_especialidade) {
    return reply.status(400).send({ error: 'id_usuario e id_especialidade são obrigatórios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO campanha_profissional_especialidade (id_campanha, id_usuario, id_especialidade)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, id_usuario, id_especialidade]
    );
    return reply.status(201).send(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return reply.status(409).send({ error: 'Profissional já vinculado a esta especialidade na campanha' });
    }
    throw err;
  }
}

async function removeProfissional(request, reply) {
  const { id, idVinc } = request.params;
  const { rowCount } = await pool.query(
    'DELETE FROM campanha_profissional_especialidade WHERE id = $1 AND id_campanha = $2',
    [idVinc, id]
  );
  if (rowCount === 0) return reply.status(404).send({ error: 'Vínculo não encontrado' });
  return reply.status(204).send();
}

async function disparar(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(`
    SELECT c.nome AS campanha, u.nome, u.email, u.whatsapp, u.telegram,
           cpe.identificador_acesso, e.nome AS especialidade
    FROM campanha_profissional_especialidade cpe
    JOIN campanhas c ON c.id = cpe.id_campanha
    JOIN usuarios u ON u.id = cpe.id_usuario
    JOIN especialidades e ON e.id = cpe.id_especialidade
    WHERE cpe.id_campanha = $1
  `, [id]);

  return {
    message: `Notificações disparadas para ${rows.length} profissional(is)`,
    profissionais: rows,
  };
}

async function inscricao(request, reply) {
  const { id } = request.params;
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento } = request.body;

  if (!nome || !cpf) {
    return reply.status(400).send({ error: 'nome e cpf são obrigatórios' });
  }

  const { rows: campanhaRows } = await pool.query(
    'SELECT id FROM campanhas WHERE id = $1', [id]
  );
  if (campanhaRows.length === 0) {
    return reply.status(404).send({ error: 'Campanha não encontrada' });
  }

  let idPaciente;
  const { rows: existingUser } = await pool.query(
    'SELECT id FROM usuarios WHERE cpf = $1', [cpf]
  );

  if (existingUser.length > 0) {
    idPaciente = existingUser[0].id;
  } else {
    const { rows: newUser } = await pool.query(
      `INSERT INTO usuarios (nome, cpf, email, telefone, whatsapp, telegram, nascimento)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [nome, cpf, email, telefone, whatsapp, telegram, nascimento || null]
    );
    idPaciente = newUser[0].id;
  }

  return reply.status(201).send({
    message: 'Inscrição realizada com sucesso',
    id_campanha: Number(id),
    id_paciente: idPaciente,
  });
}

async function horariosDisponiveis(request, reply) {
  const { id } = request.params;

  const { rows } = await pool.query(`
    SELECT c.data, c.hora,
           cpe.id AS id_profissional_especialidade,
           u.nome AS profissional,
           e.nome AS especialidade
    FROM campanhas c
    JOIN campanha_profissional_especialidade cpe ON cpe.id_campanha = c.id
    JOIN usuarios u ON u.id = cpe.id_usuario
    JOIN especialidades e ON e.id = cpe.id_especialidade
    WHERE c.id = $1
    ORDER BY u.nome, e.nome
  `, [id]);

  return rows;
}

module.exports = {
  list, getById, create, update, remove,
  addProfissional, removeProfissional, disparar,
  inscricao, horariosDisponiveis,
};

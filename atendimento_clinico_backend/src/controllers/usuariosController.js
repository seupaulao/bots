const pool = require('../config/database');
const bcrypt = require('bcrypt');

async function list(request, reply) {
  const { perfil } = request.query;
  let query = `
    SELECT u.id, u.nome, u.cpf, u.email, u.telefone, u.whatsapp, u.telegram,
           u.nascimento, u.conselho, u.dt_inicio, u.dt_fim, s.perfil
    FROM usuarios u
    LEFT JOIN seguranca s ON s.id_usuario = u.id
  `;
  const params = [];

  if (perfil) {
    query += ' WHERE s.perfil = $1';
    params.push(perfil);
  }

  query += ' ORDER BY u.nome';

  const { rows } = await pool.query(query, params);
  return rows;
}

async function getById(request, reply) {
  const { id } = request.params;
  const { rows } = await pool.query(
    `SELECT u.*, s.perfil,
            COALESCE(json_agg(json_build_object('id', e.id, 'nome', e.nome)) FILTER (WHERE e.id IS NOT NULL), '[]') AS especialidades
     FROM usuarios u
     LEFT JOIN seguranca s ON s.id_usuario = u.id
     LEFT JOIN usuario_especialidade ue ON ue.id_usuario = u.id
     LEFT JOIN especialidades e ON e.id = ue.id_especialidade
     WHERE u.id = $1
     GROUP BY u.id, s.perfil`,
    [id]
  );

  if (rows.length === 0) return reply.status(404).send({ error: 'Usuário não encontrado' });
  return rows[0];
}

async function create(request, reply) {
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento, conselho, perfil, senha } = request.body;

  if (!nome || !cpf) return reply.status(400).send({ error: 'Nome e CPF são obrigatórios' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: userRows } = await client.query(
      `INSERT INTO usuarios (nome, cpf, email, telefone, whatsapp, telegram, nascimento, conselho)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [nome, cpf, email, telefone, whatsapp, telegram, nascimento || null, conselho || null]
    );

    if (perfil && senha) {
      const hash = await bcrypt.hash(senha, 10);
      await client.query(
        'INSERT INTO seguranca (id_usuario, perfil, senha) VALUES ($1, $2, $3)',
        [userRows[0].id, perfil, hash]
      );
    }

    await client.query('COMMIT');
    return reply.status(201).send(userRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return reply.status(409).send({ error: 'CPF já cadastrado' });
    throw err;
  } finally {
    client.release();
  }
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome, cpf, email, telefone, whatsapp, telegram, nascimento, conselho, dt_inicio, dt_fim } = request.body;

  const fields = [];
  const params = [];
  let idx = 1;

  if (nome !== undefined) { fields.push(`nome = $${idx++}`); params.push(nome); }
  if (cpf !== undefined) { fields.push(`cpf = $${idx++}`); params.push(cpf); }
  if (email !== undefined) { fields.push(`email = $${idx++}`); params.push(email); }
  if (telefone !== undefined) { fields.push(`telefone = $${idx++}`); params.push(telefone); }
  if (whatsapp !== undefined) { fields.push(`whatsapp = $${idx++}`); params.push(whatsapp); }
  if (telegram !== undefined) { fields.push(`telegram = $${idx++}`); params.push(telegram); }
  if (nascimento !== undefined) { fields.push(`nascimento = $${idx++}`); params.push(nascimento); }
  if (conselho !== undefined) { fields.push(`conselho = $${idx++}`); params.push(conselho); }
  if (dt_inicio !== undefined) { fields.push(`dt_inicio = $${idx++}`); params.push(dt_inicio); }
  if (dt_fim !== undefined) { fields.push(`dt_fim = $${idx++}`); params.push(dt_fim); }

  if (fields.length === 0) return reply.status(400).send({ error: 'Nenhum campo para atualizar' });

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  );

  if (rows.length === 0) return reply.status(404).send({ error: 'Usuário não encontrado' });
  return rows[0];
}

async function addEspecialidade(request, reply) {
  const { id } = request.params;
  const { id_especialidade } = request.body;

  if (!id_especialidade) return reply.status(400).send({ error: 'id_especialidade é obrigatório' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO usuario_especialidade (id_usuario, id_especialidade) VALUES ($1, $2) RETURNING *',
      [id, id_especialidade]
    );
    return reply.status(201).send(rows[0]);
  } catch (err) {
    if (err.code === '23505') return reply.status(409).send({ error: 'Vínculo já existe' });
    throw err;
  }
}

async function removeEspecialidade(request, reply) {
  const { id, idEsp } = request.params;
  const { rowCount } = await pool.query(
    'DELETE FROM usuario_especialidade WHERE id_usuario = $1 AND id_especialidade = $2',
    [id, idEsp]
  );
  if (rowCount === 0) return reply.status(404).send({ error: 'Vínculo não encontrado' });
  return reply.status(204).send();
}

module.exports = { list, getById, create, update, addEspecialidade, removeEspecialidade };

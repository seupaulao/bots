const pool = require('../config/database');

async function list(request, reply) {
  const { rows } = await pool.query('SELECT * FROM especialidades ORDER BY nome');
  return rows;
}

async function create(request, reply) {
  const { nome } = request.body;
  if (!nome) return reply.status(400).send({ error: 'Nome é obrigatório' });

  try {
    const { rows } = await pool.query(
      'INSERT INTO especialidades (nome) VALUES ($1) RETURNING *',
      [nome]
    );
    return reply.status(201).send(rows[0]);
  } catch (err) {
    if (err.code === '23505') return reply.status(409).send({ error: 'Especialidade já existe' });
    throw err;
  }
}

async function update(request, reply) {
  const { id } = request.params;
  const { nome } = request.body;
  if (!nome) return reply.status(400).send({ error: 'Nome é obrigatório' });

  try {
    const { rows } = await pool.query(
      'UPDATE especialidades SET nome = $1 WHERE id = $2 RETURNING *',
      [nome, id]
    );
    if (rows.length === 0) return reply.status(404).send({ error: 'Especialidade não encontrada' });
    return rows[0];
  } catch (err) {
    if (err.code === '23505') return reply.status(409).send({ error: 'Especialidade já existe' });
    throw err;
  }
}

async function remove(request, reply) {
  const { id } = request.params;
  const { rowCount } = await pool.query('DELETE FROM especialidades WHERE id = $1', [id]);
  if (rowCount === 0) return reply.status(404).send({ error: 'Especialidade não encontrada' });
  return reply.status(204).send();
}

module.exports = { list, create, update, remove };

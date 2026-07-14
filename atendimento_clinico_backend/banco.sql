CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    whatsapp VARCHAR(20),
    telegram VARCHAR(20),
    nascimento DATE,
    conselho VARCHAR(50),
    dt_inicio DATE DEFAULT CURRENT_DATE,
    dt_fim DATE
);

CREATE TABLE IF NOT EXISTS seguranca (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    perfil VARCHAR(20) NOT NULL CHECK (perfil IN ('admin', 'gestor', 'paciente', 'profissional')),
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS especialidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS usuario_especialidade (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_especialidade INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    UNIQUE(id_usuario, id_especialidade)
);

CREATE TABLE IF NOT EXISTS campanhas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campanha_profissional_especialidade (
    id SERIAL PRIMARY KEY,
    id_campanha INTEGER NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_especialidade INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
    identificador_acesso VARCHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    UNIQUE(id_campanha, id_usuario, id_especialidade)
);

CREATE TABLE IF NOT EXISTS atendimentos (
    id SERIAL PRIMARY KEY,
    data_hora_atendimento TIMESTAMP NOT NULL,
    id_campanha INTEGER NOT NULL REFERENCES campanhas(id) ON DELETE CASCADE,
    id_usuario_paciente INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_profissional_especialidade INTEGER NOT NULL REFERENCES campanha_profissional_especialidade(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'desistencia', 'cancelado')),
    foi_concluido BOOLEAN DEFAULT FALSE,
    houve_desistencia BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS anamneses (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('exame', 'receita', 'laudo', 'consulta')),
    descricao TEXT,
    texto TEXT,
    id_paciente INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_profissional_especialidade INTEGER NOT NULL REFERENCES campanha_profissional_especialidade(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP DEFAULT NOW()
);

INSERT INTO usuarios (nome, cpf, email, telegram, dt_inicio)
VALUES ('PAULO CESAR SILVA JUNIOR', '81784244368', 'seupaulao@gmail.com', '+5585985907180', CURRENT_DATE);

INSERT INTO seguranca (id_usuario, perfil, senha)
VALUES (1, 'admin', '$2b$10$ixCH53mrojO4jz7SLoE/9ut30rOddutTJEC.U0upKya3dU3xHU/Gu');

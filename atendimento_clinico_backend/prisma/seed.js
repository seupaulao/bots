const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.seguranca.count();
  if (existing > 0) {
    console.log('Banco já possui dados. Seed ignorado.');
    return;
  }

  const user = await prisma.usuarios.upsert({
    where: { cpf: '81784244368' },
    update: {},
    create: {
      nome: 'PAULO CESAR SILVA JUNIOR',
      cpf: '81784244368',
      email: 'seupaulao@gmail.com',
      telegram: '+5585985907180',
    },
  });

  const hash = await bcrypt.hash('admin123', 10);
  await prisma.seguranca.upsert({
    where: { id_usuario: user.id },
    update: {},
    create: {
      id_usuario: user.id,
      perfil: 'admin',
      senha: hash,
    },
  });

  console.log('Seed concluído: usuário admin criado');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

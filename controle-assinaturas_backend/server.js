import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: '*',
  methods: ['*'],
  allowedHeaders: ['*'],
  credentials: true,
})

app.get('/', async () => {
  return { message: 'Bem-vindo ao Programa de Controle de Assinatura' }
})

const start = async () => {
  try {
    await app.listen({ port: 8000, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

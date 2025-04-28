import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
})

client.on('error', (err) => console.error('Redis Client Error:', err))

const RedisDatabase = {
  async connect() {
    if (!client.isOpen) {
      await client.connect()
    }
  },
  xAdd: (...args) => client.xAdd(...args),
  hSet: (...args) => client.hSet(...args),
  hGetAll: (...args) => client.hGetAll(...args),
  xRange: (...args) => client.xRange(...args),
}

export default RedisDatabase

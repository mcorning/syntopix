import { createClient } from 'redis'

const client = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
})

client.on('error', (err) => console.error('Redis Client Error:', err))

const RedisDatabase = {
  async connect() {
    if (!client.isOpen) {
      console.log('Connecting to Redis...')
      await client.connect()
      console.log('Redis connected.')
    }
  },

  async storeObject(collectionName, object) {
    return client.xAdd(collectionName, '*', { data: JSON.stringify(object) })
  },

  async fetchOrderedList(collectionName, start = '-', end = '+') {
    return client.xRange(collectionName, start, end)
  },
}

export default RedisDatabase

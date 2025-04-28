// /config.js
import RedisDatabase from './redis/client.js'

export default {
  redisUrl: 'redis://127.0.0.1:6379',
  databaseEngine: RedisDatabase,
}

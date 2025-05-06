// /config.js
import RedisDatabase from './redis/databaseClient.js'

export default {
  redisUrl: 'redis://127.0.0.1:6379',
  databaseEngine: RedisDatabase,
}

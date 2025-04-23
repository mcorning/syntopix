//#region Setup
import Redis from 'ioredis-rejson';

const pj = (json) => JSON.stringify(json, null, 2);
let options = {};
console.clear();
console.log('Connecting to Redis');
if (process.env.NODE_ENV === 'production') {
  console.log('Dereferencing process.env');
  options = {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    showFriendlyErrorStack: true,
  };
} else if (process.env.NODE_ENV === 'lab') {
  console.log('Using lab Redis configuration');
  const lab = require('../redis/config/redisJson.options').lab;
  options = {
    host: lab.redisHost,
    port: lab.redisPort,
    password: lab.redisPassword,
    showFriendlyErrorStack: true,
  };
}
console.log('Redis options:', pj(options));


const redis = new Redis(options);
const redisPub = new Redis(options);
const redisSub = new Redis(options);

// Event Listeners for Redis
redis.on('error', (error) => {
  if (error.code === 'ECONNRESET') {
    console.error('Connection to Redis Streams timed out.');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('Connection to Redis Streams refused!');
  } else {
    console.error('Redis error:', error);
  }
});

redis.on('reconnecting', () => {
  console.log('Reconnecting to Redis Streams...');
});

redis.on('connect', () => {
  console.log('Connected to Redis Streams!\n');
});

// Command Transformers
Redis.Command.setArgumentTransformer('xadd', (args) => {
  if (args.length === 3) {
    const argArray = [];
    argArray.push(args[0], args[1]); // Key Name & ID.

    const fieldNameValuePairs = args[2];
    for (const fieldName in fieldNameValuePairs) {
      argArray.push(fieldName, fieldNameValuePairs[fieldName]);
    }

    return argArray;
  }

  return args;
});

Redis.Command.setReplyTransformer('xrange', (result) => {
  if (Array.isArray(result)) {
    return result.map((r) => {
      const obj = { id: r[0] };
      const fieldNamesValues = r[1];

      for (let n = 0; n < fieldNamesValues.length; n += 2) {
        obj[fieldNamesValues[n]] = fieldNamesValues[n + 1];
      }
      return obj;
    });
  }
  return result;
});
//#endregion Setup

export default {
  redis,
  redisPub,
  redisSub,
};

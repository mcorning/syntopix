// source: https://app.redislabs.com/#/bdb/tabs/conf/10303198
const options = {
  local: {
    redisHost: '127.0.0.1',
    redisPassword: '', // Empty if no password is required
    redisPort: 6379,
  },
  docker: {
    redisHost: '127.0.0.1',
    redisPort: 6379,
    redisPassword: null, // No password by default for Docker
  },
};

module.exports = options[process.env.REDIS_ENV || 'local'];

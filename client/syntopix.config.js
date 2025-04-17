const ENV = process.env.NODE_ENV || 'development'

const config = {
  development: {
    VITE_APP_HOST: 'http://localhost:3334',
  },
  production: {
    VITE_APP_HOST: 'https://tensor.tqrtoken.net',
  },
  staging: {
    VITE_APP_HOST: 'http://staging-server.com',
  },
}

export default config[ENV]

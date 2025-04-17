// src/js/pkManager.js

const { addToStream } = require('../../srv/redis/syntopix/services/redisService')

const PK_STREAM_KEY = 'syntopix' // Concise key for PKs

/**
 * Retrieve an existing PK or generate a new one if none exists.
 * @returns {Promise<string>} - The existing or newly generated PK.
 */
const createPk = () => {
  console.log(`Generating new PK...`)
  return addToStream(PK_STREAM_KEY, '*', 'creator', Date.now()).then((newPk) => {
    console.log(`New PK created: ${newPk}`)
    return newPk
  })
}

module.exports = { createPk }

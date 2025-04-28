import config from '../config.js'

const db = config.databaseEngine

async function ensureConnected() {
  await db.connect()
}

async function addToStream(streamKey, id, field, value) {
  await ensureConnected()
  return db.xAdd(streamKey, id, { [field]: value })
}

async function setHash(key, fields) {
  await ensureConnected()
  return db.hSet(key, fields)
}

async function getHash(key) {
  await ensureConnected()
  return db.hGetAll(key)
}

async function getStreamRange(key, start = '-', end = '+') {
  await ensureConnected()
  return db.xRange(key, start, end)
}

export default {
  addToStream,
  setHash,
  getHash,
  getStreamRange,
}

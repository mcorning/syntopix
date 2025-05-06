import config from '../config.js'

const db = config.databaseEngine

async function ensureConnected() {
  await db.connect()
}

async function storeObject(collectionName, object) {
  await ensureConnected()
  return db.storeObject(collectionName, object)
}

async function fetchOrderedList(collectionName, start = '-', end = '+') {
  await ensureConnected()
  return db.fetchOrderedList(collectionName, start, end)
}

export default {
  storeObject,
  fetchOrderedList,
}

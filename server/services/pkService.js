// /services/pkService.js
import databaseService from './databaseService.js'

const PK_STREAM_KEY = 'syntopix:pk' // Common key for generating PKs

async function createPk() {
  console.log('Generating new PK...')
  const pkEntryId = await databaseService.storeObject(PK_STREAM_KEY, {
    createdAt: Date.now(),
  })
  console.log(`New PK created: ${pkEntryId}`)
  return pkEntryId
}

export default {
  createPk,
}

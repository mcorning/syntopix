// /services/spaceService.js
import databaseService from './databaseService.js'

async function createSpace(title) {
  const spaceData = { title, createdAt: Date.now() }
  return databaseService.storeObject('spaces', spaceData)
}

async function getSpaces() {
  return databaseService.fetchOrderedList('spaces')
}

async function deleteSpace(spaceId) {
  const deletedKey = `deleted:${spaceId}`
  // Placeholder: Actually perform a rename or logical delete.
  console.log(`Marking space ${spaceId} as deleted: ${deletedKey}`)
  return deletedKey
}


export default {
  createSpace,
  getSpaces,
  deleteSpace,
}

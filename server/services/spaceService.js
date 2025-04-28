// /services/spaceService.js
import databaseService from './databaseService.js'

async function createSpace(title) {
  const spaceData = { title, createdAt: Date.now() }
  return databaseService.addToStream(
    'spaces',
    '*',
    'data',
    JSON.stringify(spaceData)
  )
}

async function getSpaces() {
  return databaseService.getStreamRange('spaces')
}

async function deleteSpace(spaceId) {
  // Placeholder for delete logic if needed
}

export default {
  createSpace,
  getSpaces,
  deleteSpace,
}

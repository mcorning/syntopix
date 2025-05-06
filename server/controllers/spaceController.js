import spaceService from '../services/spaceService.js'
import spaceModel from '../models/spaceModel.js'

async function createSpace(data) {
  const validatedData = spaceModel.validateSpaceData(data)
  return spaceService.createSpace(validatedData.title)
}

async function getSpaces() {
  return spaceService.getSpaces()
}

async function deleteSpace(spaceId) {
  if (!spaceId) {
    throw new Error('Space ID is required to delete a space.')
  }
  return spaceService.deleteSpace(spaceId)
}

export default {
  createSpace,
  getSpaces,
  deleteSpace,
}

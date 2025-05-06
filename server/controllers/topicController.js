import topicService from '../services/topicService.js'
import topicModel from '../models/topicModel.js'

async function createTopic(data) {
  const validatedData = topicModel.validateTopicData(data)
  return topicService.createTopic(
    validatedData.spaceId,
    validatedData.title,
    validatedData.content
  )
}

async function getTopicsForSpace(spaceId) {
  if (!spaceId) {
    throw new Error('Space ID is required to fetch topics.')
  }
  return topicService.getTopicsForSpace(spaceId)
}

async function deleteTopic(spaceId, topicId) {
  if (!spaceId || !topicId) {
    throw new Error('Space ID and Topic ID are required to delete a topic.')
  }
  return topicService.deleteTopic(spaceId, topicId)
}

export default {
  createTopic,
  getTopicsForSpace,
  deleteTopic,
}

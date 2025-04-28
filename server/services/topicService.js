// /services/topicService.js
import databaseService from './databaseService.js'

async function createTopic(spaceId, title, content) {
  const topicData = { title, content, createdAt: Date.now() }
  return databaseService.addToStream(
    `space:${spaceId}:topics`,
    '*',
    'data',
    JSON.stringify(topicData)
  )
}

async function getTopicsForSpace(spaceId) {
  return databaseService.getHash(`space:${spaceId}:topics`)
}

async function deleteTopic(spaceId, topicId) {
  // Placeholder for delete logic if needed
}

export default {
  createTopic,
  getTopicsForSpace,
  deleteTopic,
}

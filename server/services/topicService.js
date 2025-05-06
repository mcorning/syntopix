// /services/topicService.js
import databaseService from './databaseService.js'

async function createTopic(spaceId, title, content) {
  const topicData = { title, content, createdAt: Date.now() }
  return databaseService.storeObject(`space:${spaceId}:topics`, topicData)
}

async function getTopicsForSpace(spaceId) {
  return databaseService.fetchOrderedList(`space:${spaceId}:topics`)
}

async function deleteTopic(spaceId, topicId) {
  const deletedKey = `deleted:${topicId}`
  // Placeholder: Actually perform a rename or logical delete.
  console.log(
    `Marking topic ${topicId} in space ${spaceId} as deleted: ${deletedKey}`
  )
  return deletedKey
}


export default {
  createTopic,
  getTopicsForSpace,
  deleteTopic,
}

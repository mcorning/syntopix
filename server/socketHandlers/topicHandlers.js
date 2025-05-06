// /socketHandlers/topicHandlers.js
import topicController from '../controllers/topicController.js'

function registerTopicHandlers(socket) {
  socket.on('create_topic', async (data, callback) => {
    try {
      const result = await topicController.createTopic(data)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })

  socket.on('fetch_topics_for_space', async (spaceId, callback) => {
    try {
      const result = await topicController.getTopicsForSpace(spaceId)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })

  socket.on('delete_topic', async ({ spaceId, topicId }, callback) => {
    try {
      const result = await topicController.deleteTopic(spaceId, topicId)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
}

export default registerTopicHandlers

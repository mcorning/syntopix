// controllers/topicController.js

import topic from './redis/commands/topic.js'

export default function registerTopicHandlers(socket, io) {
  socket.on('add_topic', (newTopic, callback) => {
    const keysMan = socket.data.keysMan
    if (!keysMan) {
      console.warn('⚠️ No keysMan found on socket, cannot add topic.')
      callback?.({ success: false, error: 'Missing keysMan' })
      return
    }

    console.log('🛠️ add_topic received:', newTopic)
    console.log('🔑 Using keysMan:', keysMan)

    topic.addTopic(keysMan, newTopic)
      .then((response) => {
        if (response.success) {
          console.log('✅ Topic added successfully:', newTopic)
          io.emit('topics_update', newTopic)
        } else {
          console.warn('⚠️ addTopic reported failure:', response)
        }
        callback?.(response)
      })
      .catch((err) => {
        console.error('❌ Error in add_topic:', err)
        callback?.({ success: false, error: err.message })
      })
  })
}

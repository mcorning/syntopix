// services/topic.js

import  {createDocument} from '../services/topicService.js'

export default {
  async addTopic(keysMan, topic) {
    console.log('📌 addTopic called with:', topic)
    try {
      const doc = await createDocument(keysMan.topicStreamKey, {
        pk: keysMan.pk,
        label: topic.label,
        description: topic.description || '',
        timestamp: Date.now(),
      })

      return {
        success: true,
        topic: doc
      }
    } catch (err) {
      console.error('❌ addTopic failed:', err)
      return {
        success: false,
        error: err.message,
      }
    }
  },

  async listTopicSpaces(keysMan) {
    console.log('🔍 listTopicSpaces using:', keysMan.pkTopicsKey)
    // Placeholder: needs integration with topicService.getTopicsForPk
    return []
  },
}

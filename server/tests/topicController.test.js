// /tests/topicController.test.js
import topicController from '../controllers/topicController.js'

async function testCreateTopic() {
  try {
    const result = await topicController.createTopic({
      spaceId: 'testSpaceId',
      title: 'Test Topic',
      content: 'This is a test topic.',
    })
    console.log('createTopic result:', result)
  } catch (error) {
    console.error('Error in createTopic:', error.message)
  }
}

async function testGetTopicsForSpace() {
  try {
    const result = await topicController.getTopicsForSpace('testSpaceId')
    console.log('getTopicsForSpace result:', result)
  } catch (error) {
    console.error('Error in getTopicsForSpace:', error.message)
  }
}

async function testDeleteTopic() {
  try {
    const result = await topicController.deleteTopic(
      'testSpaceId',
      'testTopicId'
    )
    console.log('deleteTopic result:', result)
  } catch (error) {
    console.error('Error in deleteTopic:', error.message)
  }
}

// Run tests
await testCreateTopic()
await testGetTopicsForSpace()
await testDeleteTopic()

// /tests/spaceController.test.js
import spaceController from '../controllers/spaceController.js'

async function testCreateSpace() {
  try {
    const result = await spaceController.createSpace({ title: 'Test Space' })
    console.log('createSpace result:', result)
  } catch (error) {
    console.error('Error in createSpace:', error.message)
  }
}

async function testGetSpaces() {
  try {
    const result = await spaceController.getSpaces()
    console.log('getSpaces result:', result)
  } catch (error) {
    console.error('Error in getSpaces:', error.message)
  }
}

async function testDeleteSpace() {
  try {
    const result = await spaceController.deleteSpace('testSpaceId')
    console.log('deleteSpace result:', result)
  } catch (error) {
    console.error('Error in deleteSpace:', error.message)
  }
}

// Run tests
await testCreateSpace()
await testGetSpaces()
await testDeleteSpace()

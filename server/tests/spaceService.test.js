// /tests/spaceService.test.js
import spaceService from '../services/spaceService.js'

async function testCreateSpace() {
  try {
    const result = await spaceService.createSpace('Test Space')
    console.log('createSpace result:', result)
  } catch (error) {
    console.error('Error in createSpace:', error)
  }
}

async function testGetSpaces() {
  try {
    const result = await spaceService.getSpaces()
    console.log('getSpaces result:', result)
  } catch (error) {
    console.error('Error in getSpaces:', error)
  }
}

// Run tests
await testCreateSpace()
await testGetSpaces()

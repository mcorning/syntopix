// /tests/databaseService.test.js
import databaseService from '../services/databaseService.js'

async function testStoreObject() {
  try {
    const result = await databaseService.storeObject('testStream', {
      field1: 'value1',
    })
    console.log('storeObject result:', result)
  } catch (error) {
    console.error('Error in storeObject:', error)
  }
}

async function testFetchOrderedList() {
  try {
    const result = await databaseService.fetchOrderedList('testStream')
    console.log('fetchOrderedList result:', result)
  } catch (error) {
    console.error('Error in fetchOrderedList:', error)
  }
}

// Run tests
await testStoreObject()
await testFetchOrderedList()

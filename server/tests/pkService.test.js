// /tests/pkService.test.js
import pkService from '../services/pkService.js'

async function testCreatePk() {
  try {
    const pk = await pkService.createPk()
    console.log('Generated PK:', pk)
  } catch (error) {
    console.error('Error creating PK:', error.message)
  }
}

// Run the test
await testCreatePk()

// /socketHandlers/spaceHandlers.js
import spaceController from '../controllers/spaceController.js'

function registerSpaceHandlers(socket) {
  socket.on('create_space', async (data, callback) => {
    try {
      const result = await spaceController.createSpace(data)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })

  socket.on('fetch_spaces', async (callback) => {
    try {
      const result = await spaceController.getSpaces()
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })

  socket.on('delete_space', async (spaceId, callback) => {
    try {
      const result = await spaceController.deleteSpace(spaceId)
      callback({ success: true, result })
    } catch (error) {
      callback({ success: false, error: error.message })
    }
  })
}

export default registerSpaceHandlers

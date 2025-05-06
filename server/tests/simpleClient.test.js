// /tests/simpleClientTest.js
import { io } from 'socket.io-client'

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
})

socket.on('connect', () => {
  console.log('Connected to server as client:', socket.id)

  // Test create_space
  socket.emit(
    'create_space',
    { title: 'Test Space from Client' },
    (response) => {
      console.log('create_space response:', response)

      // Test fetch_spaces after create
      socket.emit('fetch_spaces', (spacesResponse) => {
        console.log('fetch_spaces response:', spacesResponse)

        // After verifying, disconnect
        socket.disconnect()
      })
    }
  )
})

socket.on('disconnect', () => {
  console.log('Disconnected from server.')
})

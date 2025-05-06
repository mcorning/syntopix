// /server/index.js
import { createServer } from 'http'
import { Server } from 'socket.io'
import express from 'express'
import registerSpaceHandlers from './socketHandlers/spaceHandlers.js'
import registerTopicHandlers from './socketHandlers/topicHandlers.js'
import config from './config.js'
import db from './redis/databaseClient.js'

const app = express()
const httpServer = createServer(app)
// const io = new Server(httpServer, {
//   cors: {
//     origin: '*',
//   },
// })
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
// Connect to Redis
await db.connect()

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  // Register our event handlers
  registerSpaceHandlers(socket)
  registerTopicHandlers(socket)

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Start the server
const PORT = process.env.PORT || 3000
httpServer.listen(PORT, () => {
  console.log(`Syntopix Server is running on port ${PORT}`)
})

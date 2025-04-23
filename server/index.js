// index.js — fully ESM-ready with __dirname support

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

import { registerSpaceHandlers } from './spaceController.js'
import  registerTopicHandlers  from './topicController.js'
import { createPk } from './redis/services/pkService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })
const PORT = process.env.PORT || 3334

app.use(express.static(path.join(__dirname, '../client/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

httpServer.listen(PORT, () => {
  console.log(`syntopix-server index.js is running on port ${PORT}`)
})

io.on('connection', (socket) => {
  const pk = socket.handshake.auth.userID
  const socketID = socket.id

  console.log("io.on('connection') :>> ", {
    socketID,
    auth: socket.handshake.auth,
  })

  if (!pk) {
    createPk().then((pk) => socket.emit('handshake', { pk, socketID }))
  } else {
    socket.emit('handshake', { pk, socketID })
  }

  socket.on('set_keysMan', (keysMan) => {
    console.log('Received keysMan from Vue:', keysMan)
    socket.data.keysMan = keysMan

    registerSpaceHandlers({ socket, keysMan })
    registerTopicHandlers(socket, io)
  })

  socket.emit('testing', 'Come here, Watson.')

  socket.on('disconnect', () => {
    console.log(`Disconnected client: ${socket.id}`)
  })
})

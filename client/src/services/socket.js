// socket.js — Vue 3 reactive SocketService with provide/inject support

import { io } from 'socket.io-client'
import config from '../../../global.syntopix.config.js'

let internalKeysMan = null
let internalSocket = null

function createKeysMan(pk) {
  const ns = 'syntopix'
  return {
    pk,
    topicStreamKey: `${ns}:topics:stream`,
    pkTopicsKey: `${ns}:pks:${pk}:topics`,
    topicContentKey: `${ns}:topics:content`,
    topicSpaceKey: `${ns}:topics:spaces`,
    pkSpacesKey: `${ns}:pks:${pk}:spaces`,
    spaceOrderKey: `${ns}:pks:${pk}:spaces:order`,
    topicOrderKey: `${ns}:spaces::topics:order`,
    spaceKey: `${ns}:spaces:${pk}`,
  }
}

function initialize() {
  const userID = (() => {
    const pk = localStorage.getItem('pk')
    return pk === 'null' ? null : pk
  })()

  const socket = io(config.VITE_APP_HOST, {
    auth: { userID },
    transports: ['websocket'], // optional but works well
  })

  internalSocket = socket

  socket.on('handshake', ({ pk, socketID }) => {
    console.log('PK', pk)
    console.log('socketID', socketID)
    localStorage.setItem('pk', pk)
    internalKeysMan = createKeysMan(pk)
    emit('set_keysMan', internalKeysMan)
  })

  socket.on('connect', () => {
    console.log('[socket.js] Connecting to:', config.VITE_APP_HOST)

    console.log('🟢 Socket connected:', socket.id)
  })

  socket.on('disconnect', () => {
    console.warn('🔌 Socket disconnected')
  })
  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message)
  })
}

function emit(event, payload, callback) {
  if (!internalSocket) return
  internalSocket.emit(event, payload, callback)
}

function on(event, handler) {
  if (!internalSocket) return
  internalSocket.on(event, handler)
}

function getKeysMan() {
  return internalKeysMan
}

function getSocket() {
  return internalSocket
}

function onTopicsUpdate(handler) {
  on('topics_update', handler)
}

function emitAddTopic(newTopic, callback) {
  const keysMan = getKeysMan()
  if (!keysMan) {
    console.error('Cannot emit add_topic: keysMan not initialized')
    return
  }
  emit('add_topic', newTopic, callback)
}
function emitGetTopics(callback) {
  emit('get_topics', null, callback)
}

function emitWithKeysMan(event, payload, callback) {
  const keysMan = getKeysMan()
  if (!keysMan) {
    console.error(`Cannot emit ${event}: keysMan not initialized`)
    return
  }
  emit(event, { keysMan, ...payload }, callback)
}

export default {
  initialize,
  getKeysMan,
  getSocket,
  emit,
  on,
  onTopicsUpdate,
  createKeysMan,
  emitAddTopic,
  emitGetTopics,
  emitWithKeysMan,
}

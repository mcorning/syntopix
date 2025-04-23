// services/socket.js (John's protocol handler)
import { io } from 'socket.io-client'
import config from '../../syntopix.config.js'
import EVENTS from './socketEvents.js'

const socket = io(config.VITE_APP_HOST, {
  auth: {
    userID: localStorage.getItem('pk'),
  },
})

let internalKeysMan = null

function createKeysMan(pk) {
  const namespace = `19:syntopix`
  return {
    topicStreamKey: `${namespace}:topics:stream`,
    pkTopicsKey: `${namespace}:pks:${pk}:topics`,
    topicContentKey: `${namespace}:topics:content`,
    topicSpaceKey: `${namespace}:topics:spaces`,
    pkSpacesKey: `${namespace}:pks:${pk}:spaces`,
    spaceOrderKey: `${namespace}:pks:${pk}:spaces:order`,
    topicOrderKey: `${namespace}:spaces::topics:order`,
    spaceKey: `${namespace}:spaces:${pk}`,
    pk,
  }
}

function emit(event, payload, callback) {
  console.log(`📤 Emitting ${event}:`, payload)
  socket.emit(event, payload, (response) => {
    console.log(`📥 Response to ${event}:`, response)
    callback?.(response)
  })
}

function on(event, handler) {
  socket.on(event, (...args) => {
    console.log(`📡 Received ${event}:`, ...args)
    handler(...args)
  })
}

function off(event, handler) {
  if (handler) socket.off(event, handler)
  else socket.off(event)
}

function emitHandshake(keysMan) {
  console.log('🤝 Sending keysMan to server:', keysMan)
  emit(EVENTS.SET_KEYS_MAN, keysMan)
}

function onHandshake(handler) {
  on(EVENTS.HANDSHAKE, handler)
}

function offHandshake() {
  off(EVENTS.HANDSHAKE)
}

function fetchTopics(keysMan, callback) {
  console.log('📥 Fetching topics with:', keysMan.pkTopicsKey)
  emit(EVENTS.FETCH_TOPICS, null, (response) => {
    if (response.success) {
      console.log(`✅ Fetched ${response.topics.length} topics`)
      callback(response.topics)
    } else {
      console.error('❌ Failed to fetch topics:', response.error)
      callback([])
    }
  })
}

function onTopicsUpdate(handler) {
  on(EVENTS.TOPICS_UPDATE, handler)
}

function emitAddTopic(newTopic, callback) {
  if (!internalKeysMan) {
    console.warn('⚠️ Cannot emit add_topic: keysMan not initialized')
    callback?.({ success: false, error: 'Missing keysMan' })
    return
  }
  console.log('📤 Emitting add_topic with topic:', newTopic)
  emit(EVENTS.ADD_TOPIC, newTopic, callback)
}

function getKeysMan() {
  return internalKeysMan
}

function initialize(onTopicsLoaded) {
  onHandshake(({ pk }) => {
    if (!pk) {
      console.warn('⚠️ Server handshake returned null PK')
      return
    }
    localStorage.setItem('pk', pk)
    internalKeysMan = createKeysMan(pk)
    emitHandshake(internalKeysMan)
    fetchTopics(internalKeysMan, (topics) => {
      onTopicsLoaded(topics)
    })
  })
}

export default {
  socket,
  createKeysMan,
  getKeysMan,
  on,
  emit,
  off,
  emitHandshake,
  onHandshake,
  offHandshake,
  onTopicsUpdate,
  emitAddTopic,
  fetchTopics,
  initialize,
}

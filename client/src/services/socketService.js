// client/src/services/socketService.js
import Vue from 'vue'
import vuetify from '@/plugins/vuetifyX.js'
import io from 'socket.io-client'
import VueSocketIOExt from 'vue-socket.io-extended'
import VueCompositionAPI from '@vue/composition-api'

import { loadAppState } from './mainService.js'
import config from '../../syntopix.config.js'
import localStorageService from './localStorageService.js'
import router from '@/router/syntopixRouter.js'
import App from '@/App.vue'

function setPk(pk) {
  localStorageService.setItem('pk', pk)
  console.log(`PK set (Browser): ${pk}`)
}

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

async function initializeSocketAndApp() {
  const host = config.VITE_APP_HOST
  console.warn('Connecting to Socket.IO server at:', host)

  const socket = io(host, {
    auth: { userID: localStorage.getItem('pk') },
  })

  async function launchApp() {
    console.log('🚀 Launching Vue App')

    Vue.use(VueCompositionAPI)
    Vue.use(VueSocketIOExt, socket)

    Vue.config.productionTip = false
    new Vue({
      vuetify,
      router,
      render: (h) => h(App),
      mounted() {
        loadAppState()
      },
    }).$mount('#app')
  }

  socket.on('handshake', ({ pk, socketID }) => {
    console.log('Received handshake:', { pk, socketID })

    setPk(pk)
    const keysMan = createKeysMan(pk)

    Vue.prototype.$pk = pk
    Vue.prototype.$socket = socket
    Vue.prototype.$socketID = socketID

    console.log('Starting Vue app with PK and Socket ID:', { pk, socketID })
    console.log('Sending keysMan to Node:', keysMan)
    socket.emit('set_keysMan', keysMan)

    launchApp()
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err)
  })

  socket.on('disconnect', () => {
    console.warn('Socket disconnected.')
  })

  socket.on('reconnect', (attempt) => {
    console.log(`Socket reconnected after ${attempt} attempts.`)
  })
}

export default initializeSocketAndApp

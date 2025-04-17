// Error Handlers
window.onerror = function (message, source, lineno, colno, error) {
  console.error('Global error handler:', error)
  console.error('Message:', message)
  console.error('Source:', source)
  console.error('Line number:', lineno)
  console.error('Column number:', colno)
}

import Vue from 'vue'
import VueCompositionAPI from '@vue/composition-api'

import './registerServiceWorker'
import initializeSocketAndApp from './services/socketService.js'
import { setupGlobalVariables } from './services/mainService.js'

// Setup plugins
Vue.use(VueCompositionAPI)

// Run Initial Setup
setupGlobalVariables(Vue)

// Initialize the App with Socket and PK Handling
initializeSocketAndApp() //

// services/appUtils.js
import localStorageService from './localStorageService.js'
import packageJson from '../../package.json'

export function setupGlobalVariables(Vue) {
  const pin = localStorageService.getItem('pin')
  Vue.prototype.$pin = pin ?? ''

  const { version, experimenting, countryOverride, da } = packageJson
  const hostName = window.location.hostname

  function getCountry() {
    return hostName.includes('-') ? 'yy' : hostName.slice(0, 2)
  }

  const country = countryOverride || getCountry()
  Vue.prototype.$version = version
  Vue.prototype.$experimenting = experimenting
  Vue.prototype.$country = country
  Vue.prototype.$debug = da ?? country === '19'
  Vue.prototype.$secret =
    process.env.SECRETHANDSHAKE ??
    require('../../../server/redis/config/redisJson.options').SECRETHANDSHAKE
  Vue.prototype.$preambleBase = `tqr:${country}`

  Vue.prototype.$myError = function (name, message, info) {
    const error = Object.create(Error.prototype)
    error.message = message
    error.info = info
    error.name = name
    return error
  }

  console.log('Global variables set up:', { pin, version, country })
}

export function loadAppState() {
  const appState = localStorageService.getItem('appState')
  if (appState) {
    console.log('App state loaded:', appState)
  } else {
    localStorageService.setItem('appState', { initialized: true })
  }
}

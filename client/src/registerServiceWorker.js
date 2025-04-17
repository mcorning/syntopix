import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log('Service worker is active.')
    },
    registered(registration) {
      console.log('Service worker has been registered.')

      // Routinely check for app updates by testing for a new service worker.
      setInterval(() => {
        registration.update()
      }, 1000 * 60 * 60) // hourly checks
    },
    cached() {
      console.log('Content has been cached for offline use.')
    },
    updatefound() {
      console.log('New content is downloading.')
    },
    updated(registration) {
      // Add a custom event and dispatch it.
      // Used to display of a 'refresh' banner following a service worker update.
      // Set the event payload to the service worker registration object.
      console.log('New content is available. Firing swUpdated event.')
      document.dispatchEvent(new CustomEvent('swUpdated', { detail: registration }))
    },
    offline() {
      console.log('No internet connection found. App is running in offline mode.')
      document.dispatchEvent(new CustomEvent('offline'))
    },
    error(error) {
      console.error('Error during service worker registration:', error)
    },
  })
}

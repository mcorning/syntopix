import { createApp } from 'vue'
import App from './App.vue'
import vuetify from '../src/plugins/veutify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')

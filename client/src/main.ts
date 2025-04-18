import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/veutify'
import router from './router' // ✅ add this line

const app = createApp(App)
app.use(vuetify)
app.use(router) // ✅ use the router here
app.mount('#app')

import { createRouter, createWebHistory } from 'vue-router'
import Syntopix from '@/views/Syntopix.vue'

const routes = [
  {
    path: '/',
    name: 'Syntopix',
    component: Syntopix,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router

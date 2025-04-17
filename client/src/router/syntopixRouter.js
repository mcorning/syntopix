import Vue from 'vue'
import Router from 'vue-router'
import Syntopix from '@/views/Syntopix.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/:id?',
      name: 'Syntopix',
      component: Syntopix,
    },
  ],
})

<template>
  <v-app style="background-color: white">
    <systemHeader :show-avatar="true" :cid="pk" />

    <v-main id="main">
      <div v-if="false">
        <v-btn color="error" @click="triggerError">Trigger App Error</v-btn>
      </div>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </v-main>

    <v-footer id="footer" ref="footer" app color="primary" dark class="ma-0" padless>
      <span class="white--text">&copy; 2025 Syntopix</span><v-spacer /><span
        class="white--text pr-5"
        >{{ pk }}</span
      >
    </v-footer>
  </v-app>
</template>

<script setup>
import systemHeader from '@/components/systemHeader.vue'
import { ref, onMounted, provide, computed, watch, watchEffect } from 'vue'
import SocketService from '@/services/socket'

const socket = ref(null)
const keysMan = ref(null)

const pk = computed(() => {
  return localStorage.getItem('pk') || '(not set)'
})
provide('socket', socket)
provide('keysMan', keysMan)
provide('pk', pk)

watchEffect(() => {
  const km = SocketService.getKeysMan()
  if (km) {
    keysMan.value = { ...km }
    socket.value = SocketService.getSocket()
  }
})

watch(pk, (newPk) => {
  console.log('👀 Reactive PK updated in App.vue:', newPk)
})

onMounted(() => {
  SocketService.initialize()
})

function triggerError() {
  throw new Error('Test error from App.vue')
}
</script>

<style scoped>
#main {
  overflow-y: auto;
}
</style>

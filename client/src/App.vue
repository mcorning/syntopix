<template>
  <v-app style="background-color: 'white'">
    <systemHeader :show-avatar="true" cid="syntopix-2025" />

    <v-main id="main" style="overflow-y: auto">
      <div v-if="false">
        <v-btn color="error" @click="triggerError">Trigger App Error</v-btn>
      </div>
      <keep-alive>
        <router-view />
      </keep-alive>
    </v-main>

    <v-footer app color="primary" height="48">
      <span class="white--text">&copy; 2025 Syntopix</span>
    </v-footer>
  </v-app>
</template>

<script setup>
import systemHeader from '@/components/systemHeader.vue'

function triggerError() {
  throw new Error('Test error from App.vue')
}
</script>

<style scoped>
#main {
  height: 100vh;
}
</style>

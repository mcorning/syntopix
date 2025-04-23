<template>
  <v-system-bar id="sysBar" ref="sysBar" app color="primary" dark height="48">
    <v-col cols="2">
      <v-dialog v-model="avatar" width="500">
        <template #activator="{ props }">
          <v-avatar v-bind="props">
            <span
              class="text-h6"
              :style="{ color: barTextColor }"
              v-text="cid.slice(11, 13)"
            ></span>
          </v-avatar>
        </template>
        <v-card>
          <v-card-title>Avatar Dialog</v-card-title>
          <v-card-text> This is a placeholder dialog. </v-card-text>
        </v-card>
      </v-dialog>
    </v-col>
  </v-system-bar>
</template>

<script setup>
import { ref, computed } from 'vue'

const avatar = ref(false)
const barTextColor = computed(() => '#FFFFFF')

defineProps({
  showAvatar: Boolean,
  cid: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
#sysBar {
  padding-left: 16px;
}
</style>

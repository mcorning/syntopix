<template>
  <v-container fluid fill-height>
    <div v-if="!hasSpaceTopics">No Space Topics yet.</div>

    <div class="layout">
      <SpaceMan :spaces="spaces" :topics="topics" @add-topic="addTopic" />
      <SpaceMan
        v-if="test"
        :spaces="spaces"
        :topics="topics"
        :local-tab-topics="localTabTopics"
        :local-space-topics="localSpaceTopics"
        :selected-space="selectedSpace"
        :selected-topic="selectedTopic"
        :sidebar-visible="sidebarVisible"
        :sidebar-width="sidebarWidth"
        :open-space="openSpace"
        @add-topic="addTopic"
        @update:openSpace="setOpenSpace"
        @fetch-topics-for-space="fetchTopicsForSpace"
        @move="handleIntent"
        @X-delete-space="deleteSpace"
        @select-space="selectSpace"
        @delete-topic-from-space="onDeleteTopicFromSpace"
        @reorder-spaces="reorderSpaces"
        @reorder-topics="saveTopicOrder"
        @update-spaces="updateSpaces"
        @create-space="createSpace"
        @add-space-to-topic="addSpaceToTopic"
        @remove-space-from-topic="removeSpaceFromTopic"
        @update-selected-topic="updateSelectedTopic"
        @create-topic="createTopic"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, inject, watchEffect, watch } from 'vue'
import SpaceMan from '@/components/SpaceMan.vue'
import SocketService from '@/services/socket.js'

const socket = inject('socket')
const keysMan = inject('keysMan')
const pk = inject('pk')
console.log(socket.value)
console.log(keysMan)

const spaces = ref([])
const topics = ref([])

const localSpaceTopics = ref({})
const selectedSpace = ref(null)
const selectedTopic = ref(null)
const sidebarVisible = ref(true)
const sidebarWidth = ref(300)
const openSpace = ref(null)
const localTabTopics = ref([])
const test = ref(false)

const hasSpaceTopics = computed(() => {
  return Object.keys(localSpaceTopics.value).length > 0
})

function addTopic(newTopic) {
  SocketService.emitAddTopic(newTopic, (response) => {
    if (response.success) {
      console.log('✅ Topic added:', response)
    } else {
      console.error('❌ Failed to add topic:', response.error)
    }
  })
}

function setOpenSpace() {}
function fetchTopicsForSpace() {}
function handleIntent() {}
function deleteSpace() {}
function selectSpace() {}
function onDeleteTopicFromSpace() {}
function reorderSpaces() {}
function saveTopicOrder() {}
function updateSpaces() {}
function createSpace() {}
function addSpaceToTopic() {}
function removeSpaceFromTopic() {}
function updateSelectedTopic() {}
function createTopic(topic) {
  // Step 1: Send to backend (Redis)
  saveTopicToServer(topic)

  // Step 2: Local update
  const spaceId = selectedSpace.value?.id
  if (!spaceId) return

  if (!localSpaceTopics.value[spaceId]) {
    localSpaceTopics.value[spaceId] = []
  }

  localSpaceTopics.value[spaceId].push(topic)
}

function saveTopicToServer(topic) {
  SocketService.socket.emit('topic:create', topic)
}

onMounted(() => {
  SocketService.initialize()
})

watchEffect(() => {
  const km = SocketService.getKeysMan()
  if (km) {
    keysMan.value = km
    socket.value = SocketService.getSocket()
  }
})

watch(pk, (newPk) => {
  console.log('👀 Reactive PK updated in App.vue:', newPk)
})
</script>

<style scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

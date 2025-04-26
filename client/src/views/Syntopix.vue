<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" sm="5" md="4" lg="3">
        <Spaces
          :spaces="spaces"
          :selected-space="selectedSpace"
          @select-space="selectSpace"
          @reorder-spaces="reorderSpaces"
        />
      </v-col>
      <v-col cols="12" sm="7" md="8" lg="9">
        <Topics
          :topics="topics"
          :selected-space="selectedSpace"
          :selected-topic="selectedTopic"
          :local-tab-topics="localTabTopics"
          :local-space-topics="localSpaceTopics"
          :sidebar-visible="sidebarVisible"
          :sidebar-width="sidebarWidth"
          @add-topic="addTopic"
          @delete-topic-from-space="onDeleteTopicFromSpace"
          @reorder-topics="saveTopicOrder"
          @update-selected-topic="updateSelectedTopic"
          @create-topic="createTopic"
          @add-space-to-topic="addSpaceToTopic"
          @remove-space-from-topic="removeSpaceFromTopic"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, inject, watchEffect, watch } from 'vue'
import Spaces from '@/components/Spaces.vue'
import Topics from '@/components/Topics.vue'
import SocketService from '@/services/socket.js'

const socket = inject('socket')
const keysMan = inject('keysMan')
const pk = inject('pk')
console.log(socket.value)
console.log(keysMan)

const spaces = ref([
  { id: 'space-1', name: 'Alpha' },
  { id: 'space-2', name: 'Bravo' },
  { id: 'space-3', name: 'Charlie' },
])
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
function fetchTopics() {
  SocketService.emitGetTopics((result) => {
    console.log('Topics received:', result)
    topics.value = Array.isArray(result) ? result : []
  })
}

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
  SocketService.on('ready', () => {
    fetchTopics()
  })
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

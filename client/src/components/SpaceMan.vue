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
// import { ref, watch } from 'vue'
// import { Audit, deriveResponseType } from '@/js/helpers.js'

import Topics from '@/components/Topics.vue'
import Spaces from '@/components/Spaces.vue'

defineProps({
  spaces: {
    type: Array,
    default: () => [
      { id: 'space-1', name: 'Romeo' },
      { id: 'space-2', name: 'Delta' },
      { id: 'space-3', name: 'Sierra' },
    ],
  },
  selectedSpace: {
    type: Object,
    default: () => null,
  },
  topics: {
    type: Array,
    required: true,
  },
})

function onSelectSpace() {}

// const emit = defineEmits([
//   'select-space',
//   'create-space',
//   'add-topic',
//   'edit-topic',
//   'reorder-topic-cards',
// ])

/*
const addingTopic = ref(false)
const showNewTopicForm = ref(false)

const newTopic = ref({
  title: '',
  summary: '',
  created: Date.now().toString(),
  private: true,
})

const localTopics = ref(props.topics)


const topicsDragOptions = {
  animation: 150,
  group: 'topics',
  ghostClass: 'ghost',
}

const dropZoneDragOptions = {
  animation: 200,
  group: {
    name: 'topics',
    pull: 'clone',
    put: false,
  },
  sort: false,
}

const spacesDragOptions = {
  animation: 150,
  group: 'spaces',
  handle: '.space-item',
}

const spaceTopicsDragOptions = {
  animation: 150,
  group: 'topics',
  ghostClass: 'ghost',
}

function resetDraggingState() {
  // Vue 3 doesn't use `this` in <script setup>
  // Manually reset external state if needed
}

function onTopicsReordered() {
  const newTopicOrder = localTopics.value
  console.clear()
  console.log(
    `Emitting reordered topics `,
    newTopicOrder.map((v) => v.title)
  )
  emit('reorder-topic-cards', { newTopicOrder })
}

function addTopic() {
  const responseHandlers = {
    success: (response) => {
      Audit.add({ msg: `addTopic() successful ${response.success}` })
    },
    prompt: (response) => {
      Audit.add({ msg: `User prompt required: ${response.prompt}` })
    },
    error: (response) => {
      Audit.add({ msg: `!!! ${response.error} ERROR in addTopic()` })
    },
    default: () => {
      console.warn('Unhandled response type')
    },
  }

  const respond = (response) => {
    const type = response.type || deriveResponseType(response)
    const handler = responseHandlers[type] || responseHandlers.default
    handler(response)
    Audit.report('Audit: Adding Topic ')
  }

  if (newTopic.value.title.trim()) {
    emit('add-topic', newTopic.value, respond)
  }
  addingTopic.value = false
  resetForm()
}

function promptForSpace(event) {
  emit('create-space', event)
}

function removeSpaceFromTopic(topic, spaceId) {
  topic.spaces = topic.spaces.filter((s) => s !== spaceId)
}

function createdOn(id) {
  const timestamp = parseInt(id.split('-')[0])
  return new Date(timestamp).toLocaleString()
}

function resetForm() {
  newTopic.value = {
    title: '',
    summary: '',
    created: Date.now().toString(),
    private: true,
  }
  showNewTopicForm.value = false
}

watch(
  () => props.topics,
  (newVal) => {
    localTopics.value = [...newVal] // Keep a reactive, decoupled local copy
  },
  { immediate: true }
)
  */
</script>

<style scoped>
.space-name-input {
  border: none;
  font-size: 1rem;
  font-weight: bold;
  background: transparent;
  outline: none;
}

.spaces {
  width: 50%;
  padding: 20px;
  border: 1px solid #ccc;
  background: #a7cde1;
}

.topics {
  padding: 20px;
  border: 1px solid #ccc;
  background: #f6f4ec;
}

.topics-drop-container {
  min-height: 80px;
  padding: 10px;
  transition: min-height 0.2s ease-in-out;
}

.topics-drop-container:has(.dragging-item) {
  min-height: 120px;
}

.expanded-drop-zone {
  min-height: 150px !important;
  background: rgba(0, 123, 255, 0.1);
  border: 2px dashed #007bff;
}

.spaces-list {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.space-item {
  background: white;
  padding: 10px;
  border: 1px solid #ccc;
  transition: border 0.2s ease-in-out;
}

.space-item.drop-hover {
  border: 2px dashed #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
}

.dragging-item {
  width: 250px !important;
  min-width: 250px !important;
  opacity: 0.8;
  transform: scale(1);
}

.space-chip {
  background: #3bdeff;
  color: #000;
  font-weight: bold;
}

.topic-chip {
  background: #ffeb3b;
  color: #000;
  font-weight: bold;
}

.drop-zone {
  padding: 20px;
  border: 2px dashed #007bff;
  background: #dbeafe;
  text-align: center;
  margin-bottom: 10px;
}

.drop-zone-topics {
  padding: 20px;
  border: 2px solid #007bff;
  text-align: center;
  margin-bottom: 10px;
}

.topics-drop-zone {
  padding: 7px;
  background: none !important;
  border: none !important;
}

.topic-col {
  min-width: 250px;
}

.topic-card {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex-grow: 1;
}
</style>

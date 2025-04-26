<template>
  <v-card class="topics" flat>
    <div class="d-flex justify-between align-center mb-2">
      <h3 class="text-h6 font-weight-bold">Topics</h3>
      <!-- Placeholder for future "Add Topic" button -->
    </div>
    <v-divider class="mb-2"></v-divider>

    <!-- Topics List (Draggable) -->
    <VueDraggable
      v-model="localTopics"
      item-key="id"
      class="topics-drop-zone d-flex flex-wrap w-100"
      :ghost-class="'dragging-item'"
      v-bind="topicsDragOptions"
      @end="onTopicsReordered"
      tag="div"
    >
      <v-col
        v-for="topic in localTopics"
        :key="topic.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
        xl="3"
        class="topic-col"
      >
        <v-card class="topic-card pa-3">
          <v-card-title class="text-h6 font-weight-bold">{{ topic.title }}</v-card-title>
          <v-card-subtitle class="text-caption text-grey">
            ID: {{ topic.id }}<br />
            {{ new Date(+topic.id.split('-')[0]).toLocaleString() }}
          </v-card-subtitle>
          <v-card-text class="text-body-2 mb-2">
            {{ topic.summary || 'No summary provided' }}<br />
            <strong>{{ topic.content?.split(/\s+/).filter(Boolean).length || 0 }}</strong> words
          </v-card-text>
          <div class="d-flex justify-space-between align-center px-2 pb-1">
            <div class="topic-chip">Spaces ({{ topic.spaces?.length || 0 }})</div>
            <div>
              <v-btn size="small" variant="text">EDIT</v-btn>
              <v-btn size="small" variant="text" color="error">DELETE</v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </VueDraggable>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  topics: {
    type: Array,
    required: true,
  },
  selectedSpace: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['reorder-topics'])
const localTopics = ref([])

const { name } = useDisplay()

watch(name, (val) => {
  console.log('📱 Breakpoint changed:', val)
})

watch(
  () => props.topics,
  (newVal) => {
    localTopics.value = Array.isArray(newVal) ? [...newVal] : []
  },
  { immediate: true }
)

const topicsDragOptions = {
  animation: 200,
  group: 'topics',
}

function onTopicsReordered() {
  emit('reorder-topics', localTopics.value)
}
</script>

<style scoped>
.v-card.topics {
  background: #f9fafb;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.topics {
  background: #f6f4ec;
  padding: 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topic-col {
  min-width: 250px;
}

.topic-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  transition: box-shadow 0.2s ease, background-color 0.2s ease;
}

.topic-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.topic-chip {
  background: #e0f7fa;
  color: #006064;
  font-weight: bold;
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 0.75rem;
}

.topics-drop-zone {
  padding: 7px;
  background: none !important;
  border: none !important;
}
</style>

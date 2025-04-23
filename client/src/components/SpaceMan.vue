<template>
  <v-container fluid>
    <v-row>
      <!-- Spaces Section -->
      <v-col cols="4">
        <v-card color="accent">
          <v-card-title class="white--text">Spaces</v-card-title>
          <v-card-text>
            <!-- Drop Zone for Topics -->
            <v-row>
              <v-col>
                <VueDraggable
                  v-model="zone"
                  class="drop-zone"
                  v-bind="dropZoneDragOptions"
                  @add="promptForSpace"
                >
                  <p>Drop Topics here to create a new Space</p>
                </VueDraggable>
              </v-col>
            </v-row>
            <!-- End of Drop Zone -->

            <!-- Spaces List (Sortable) -->
            <v-row>
              <v-col>
                <VueDraggable
                  v-model="localSpaces"
                  v-bind="spacesDragOptions"
                  class="spaces-list"
                  tag="transition-group"
                  name="fade"
                >
                  <v-card v-for="space in localSpaces" :key="space.id" class="space-card" outlined>
                    <v-card-title>
                      <v-btn text @click="selectSpace(space)">edit</v-btn>
                      <span class="ml-2">{{ space.name }}</span>
                    </v-card-title>
                    <v-card-text> Topics </v-card-text>
                  </v-card>
                </VueDraggable>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Topics Section -->
      <v-col cols="8">
        <div class="topic-grid">
          <div v-for="topic in topics" :key="topic.id">
            {{ topic.label }}
          </div>
        </div>
        <v-card color="teal">
          <v-card-title class="white--text">
            Topics
            <v-spacer />
            <v-btn
              prepend-icon="mdi-plus-box"
              color="secondary"
              variant="elevated"
              @click="showNewTopicForm = true"
            >
              ADD TOPIC
            </v-btn>
          </v-card-title>
          <v-card-text> Reorder a Topic here to see your Space reorder automatically </v-card-text>
          <v-expand-transition>
            <v-card v-if="showNewTopicForm" flat class="mt-4 pa-4">
              <v-text-field v-model="newTopic.title" label="Title" />
              <v-textarea v-model="newTopic.summary" label="Summary" rows="2" auto-grow />
              <v-checkbox v-model="newTopic.private" label="Private Topic" />

              <v-row justify="end">
                <v-btn color="primary" variant="text" @click="submitNewTopic">ADD</v-btn>
                <v-btn variant="text" @click="resetForm">CANCEL</v-btn>
              </v-row>
            </v-card>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps({
  spaces: {
    type: Array,
    default: () => [],
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

const emit = defineEmits(['select-space', 'create-space', 'add-topic'])

const zone = ref([])
const localSpaces = ref(props.spaces)

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
  animation: 300,
  group: 'spaces',
  handle: '.space-card',
}

function promptForSpace(event) {
  emit('create-space', event)
}

function selectSpace(space) {
  emit('select-space', space)
}
const showNewTopicForm = ref(false)
const newTopic = ref({
  title: '',
  summary: '',
  created: Date.now().toString(),
  private: true,
})

function submitNewTopic() {
  emit('add-topic', { ...newTopic.value })
  resetForm()
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
</script>

<style scoped>
.drop-zone {
  border: 2px dashed #00f;
  padding: 1rem;
  margin-bottom: 1rem;
}

.space-card {
  margin-bottom: 0.5rem;
}
</style>

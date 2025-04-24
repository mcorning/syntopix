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
                  @add="promptForSpace($event)"
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
                  @start="isDraggingSpace = true"
                  @end="resetDraggingState"
                >
                  <v-card
                    v-for="space in localSpaces"
                    :key="space.id"
                    class="space-item"
                    :class="{ 'drop-hover': isOverSpace === space.id }"
                    height="auto"
                  >
                    <v-text-field
                      v-model="space.name"
                      dense
                      :autofocus="isNew"
                      :hint="space.name ? 'Enter key to add' : 'Give your Space a name'"
                      persistent-hint
                      label="Space"
                      :append-icon="'mdi-plus'"
                      :append-outer-icon="'mdi-delete'"
                      @click:append="createSpace(space)"
                      @click:append-outer="deleteSpace(space)"
                      @keyup.enter="createSpace"
                    />

                    <!-- Draggable Topics within each Space (Sortable) -->
                    <VueDraggable v-if="false" v-model="space.topics" v-bind="topicsDragOptions">
                      <v-card flat height="auto">
                        <v-card-subtitle class="text-right pa-1"
                          >Topics ({{ space.topics?.length }})</v-card-subtitle
                        >
                        <v-card-text class="accent lighten-1">
                          <!-- update Space card with its Topics -->
                          <!-- can add or remove Topics from Space card -->
                          <VueDraggable
                            v-model="space.topics"
                            v-bind="spaceTopicsDragOptions"
                            @add="
                              manageTopicSpaces({
                                topic: $event.data,
                                to: space.id,
                              })
                            "
                            @remove="handleTopicRemoval($event, space)"
                            ><v-chip
                              v-for="topic in space.topics"
                              :key="topic.id"
                              class="topic-chip"
                            >
                              {{ topic.title }}
                            </v-chip></VueDraggable
                          >
                        </v-card-text>
                      </v-card>
                    </VueDraggable>

                    <!-- better handles space card drop -->
                    <VueDraggable
                      v-else
                      v-model="space.topics"
                      v-bind="spaceTopicsDragOptions"
                      class="topics-drop-container mb-5"
                      :class="{
                        'expanded-drop-zone': isOverSpace === space.id,
                      }"
                      @add="
                        manageTopicSpaces({
                          topic: $event.data,
                          to: space.id,
                        })
                      "
                      @remove="handleTopicRemoval($event, space)"
                    >
                      <v-card flat height="auto">
                        <v-card-subtitle class="text-right pa-1">
                          Topics ({{ space.topics?.length }})
                        </v-card-subtitle>
                        <v-card-text color="accent lighten-1" class="drop-zone-topics">
                          <VueDraggable v-model="space.topics" v-bind="spaceTopicsDragOptions">
                            <v-chip
                              v-for="topic in space.topics"
                              :key="topic.id"
                              class="ma-2"
                              close
                              color="secondary lighten-1"
                              text-color="black"
                              @click:close="removeSpaceFromTopic(topic, space.id)"
                            >
                              {{ topic.title }}
                            </v-chip>
                          </VueDraggable>
                        </v-card-text>
                      </v-card>
                    </VueDraggable>
                  </v-card>
                </VueDraggable>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Topics List (Sortable) -->
      <v-col cols="8">
        <v-card
          color="secondary lighten-1
      "
        >
          <v-card-title class="pb-0">Topics</v-card-title>
          <v-card-actions class="pt-0">
            <span class="text-caption"
              >Reorder a Topic here to see your Space reorder automatically</span
            >
            <v-spacer></v-spacer>
            <v-btn text @click="addingTopic = true"> Add Topic </v-btn>
          </v-card-actions>

          <!-- New Topic Card -->
          <v-card v-if="addingTopic" class="mt-5" color="secondary lighten-5">
            <v-card-title>New Topic</v-card-title>
            <v-card-text @keyup.enter="addTopic">
              <v-text-field
                v-model="newTopic.title"
                autofocus
                label="Name"
                :hint="newID"
                persistent-hint
              ></v-text-field>
              <v-text-field v-model="newTopic.summary" label="Summary"></v-text-field>
              <v-checkbox v-model="newTopic.isPrivate" label="Private Topic" />
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="addTopic"> Add </v-btn>
              <v-spacer></v-spacer>
              <v-btn text @click="addingTopic = false"> Cancel </v-btn>
            </v-card-actions>
            <v-card-text> </v-card-text>
          </v-card>

          <!-- Topics Section -->
          <v-row>
            <VueDraggable
              v-model="localTopics"
              v-bind="topicsDragOptions"
              class="d-flex flex-wrap topics-drop-zone"
              :ghost-class="'dragging-item'"
              @end="onTopicsReordered"
            >
              <v-col
                v-for="topic in localTopics"
                :key="topic.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
                class="topic-col"
              >
                <v-card class="mx-auto pa-3 topic-card" color="secondary lighten-4">
                  <v-card-text>
                    <v-card-title class="text-wrap">
                      {{ topic.title }}
                    </v-card-title>
                    <v-card-subtitle>
                      ID: {{ topic.id }}
                      <p>
                        {{ createdOn(topic.id) }}
                      </p>
                      <p>
                        {{ topic.lastUpdate }}
                      </p>
                      <p>{{ topic.summary }}</p>
                      <p>{{ topic.words }} words</p>
                    </v-card-subtitle>

                    <v-card-subtitle class="text-left pa-1">
                      Spaces ({{ topic.spaces?.length }})
                    </v-card-subtitle>
                    <v-card color="secondary lighten-3" flat>
                      <v-card-text color="secondary lighten-1" class="drop-zone-topics">
                        <v-chip
                          v-for="(space, idx) in topic.spaces"
                          :key="idx"
                          class="ma-2"
                          close
                          color="accent lighten-1"
                          @click:close="removeSpaceFromTopic(topic, space)"
                        >
                          {{ space }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn text @click="$emit('edit-topic', topic)"> Edit</v-btn>
                    <v-spacer />
                    <v-btn text @click="deleteTopic(topic)"> Delete</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </VueDraggable>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Audit, deriveResponseType } from '@/js/helpers.js'

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

const emit = defineEmits([
  'select-space',
  'create-space',
  'add-topic',
  'edit-topic',
  'reorder-topic-cards',
])

const zone = ref([])
const addingTopic = ref(false)
const showNewTopicForm = ref(false)

const newTopic = ref({
  title: '',
  summary: '',
  created: Date.now().toString(),
  private: true,
})

const localSpaces = ref(props.spaces)
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

<template>
  <v-container fluid class="container">
    <v-row>
      <!-- Spaces Section -->
      <v-col>
        <v-card color="accent">
          <v-card-title class="white--text">Spaces</v-card-title>
          <v-card-text>
            <!-- Drop Zone for Topics -->
            <VueDraggable
              v-model="zone"
              class="drop-zone mt-2"
              v-bind="dropZoneDragOptions"
              @add="onAddToZone"
            >
              <p>Drop Topics here to create a new Space</p>
            </VueDraggable>

            <!-- Spaces List (Sortable) -->
            <VueDraggable
              v-model="localSpaces"
              v-bind="spacesDragOptions"
              class="spaces-list"
              tag="transition-group"
              name="fade"
              @start="isDraggingSpace = true"
              @end="resetDraggingState"
            >
              <div
                v-for="space in localSpaces"
                :key="space.id"
                class="space-item"
                :class="{ 'drop-hover': isOverSpace === space.id }"
              >
                <v-text-field
                  v-model="space.name"
                  dense
                  :autofocus="isNew"
                  :hint="space.name ? String(space.id) : 'Give your Space a name'"
                  persistent-hint
                  label="Space"
                  append-outer-icon="mdi-delete"
                  @click:append-outer="removeSpace(space)"
                />

                <!-- Draggable Topics within each Space (Sortable) -->
                <VueDraggable
                  v-model="space.topics"
                  v-bind="topicsDragOptions"
                  :group="{ name: 'topics', pull: true, put: ['topics'] }"
                >
                  <v-card flat height="auto">
                    <v-card-subtitle class="text-right pa-1"
                      >Topics ({{ space.topics.length }})</v-card-subtitle
                    >
                    <v-card-text class="drop-zone-topics">
                      <span v-if="space.topics.length === 0">Drop Topic here</span>
                      <VueDraggable
                        v-model="space.topics"
                        v-bind="topicsDragOptions"
                        :group="{ name: 'topics', pull: true, put: ['topics'] }"
                        ><v-chip v-for="topic in space.topics" :key="topic.id" class="topic-chip">
                          {{ topic.name }}
                        </v-chip></VueDraggable
                      >
                    </v-card-text>
                  </v-card>
                </VueDraggable>
              </div>
            </VueDraggable>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Topics List (Sortable) -->
      <v-col>
        <v-card class="" color="secondary">
          <v-card-title>Topics</v-card-title>
          <VueDraggable v-model="topics" v-bind="topicsDragOptions">
            <v-card
              v-for="topic in topics"
              :key="topic.id"
              class="ma-2"
              color="secondary lighten-5"
            >
              <v-card-text>
                <v-card-title v-text="topic.name"></v-card-title>
                <v-card-subtitle>
                  ID: {{ topic.id }}
                  <br />
                  {{ topic.summary }}
                </v-card-subtitle>
              </v-card-text>
            </v-card>
          </VueDraggable>

          <v-card v-if="addingTopic" class="mt-5">
            <v-card-title>New Topic</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="newTopic.name"
                autofocus
                label="Name"
                :hint="newID"
                persistent-hint
              ></v-text-field>
              <v-text-field v-model="newTopic.summary" label="Summary"></v-text-field>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="addTopic"> Add </v-btn>
              <v-spacer></v-spacer>
              <v-btn text @click="addingTopic = false"> Cancel </v-btn>
            </v-card-actions>
            <v-card-text> </v-card-text>
          </v-card>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="addingTopic = true"> Add Topic </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'

export default {
  components: { VueDraggable },
  props: {
    localTabTopics: {
      type: Array,
      required: true,
    },
    selectedTopic: {
      type: Object,
      default: null,
    },
    openSpace: {
      type: Object,
      default: () => ({ id: '', topix: [] }),
    },
    spaces: {
      type: Array,
      required: true,
    },
    localSpaceTopics: {
      type: Array,
      default: () => [],
    },
    selectedSpace: {
      type: String,
      default: null,
    },
  },
  computed: {
    client() {
      return this.$socket ? this.$socket.client : null
    },
    dropZoneDragOptions() {
      return {
        group: {
          name: 'dropzone',
          pull: false,
          put: ['topics'], // ✅ Only allows Topics to be dropped
        },
        animation: 200,
        fallbackOnBody: false,
        ghostClass: 'dragging-item',
      }
    },
    topicsDragOptions() {
      return {
        group: {
          name: 'topics',
          pull: 'clone', // ✅ Topics can be dragged
          put: ['topics'], // ✅ Topics can be dropped into Spaces but not Spaces into Topics
        },
        animation: 200,
        fallbackOnBody: false,
        ghostClass: 'dragging-item',
      }
    },
    spacesDragOptions() {
      return {
        group: {
          name: 'spaces',
          pull: true, // ✅ Spaces can be moved
          put: false, // ❌ Prevents Spaces from being dropped into Topics
        },
        animation: 300,
        fallbackOnBody: false,
        ghostClass: 'dragging-item',
      }
    },
  },

  data() {
    return {
      newID: '',
      newTopic: { id: '', name: '', summary: '' },
      addingTopic: false,
      isDraggingSpace: false,
      zone: [],
      topics: [
        {
          id: 3,
          name: 'Abstract',
          summary: 'We introduce Practical Computation',
        },
        {
          id: 4,
          name: 'Layer 1: Data',
          summary: 'Records, Repository, and Recall',
        },
        { id: 5, name: 'Later 2: Truth', summary: 'The Truth about the Truth' },
        { id: 6, name: 'Later 3: Trust', summary: 'Measuring Trust' },
      ],
      // spaces: [
      //   {
      //     id: '1740602498070',
      //     name: 'Major Ideas',
      //     topics: [
      //       {
      //         id: 3,
      //         name: 'Abstract',
      //         summary: 'We introduce Practical Computation',
      //       },
      //     ],
      //   },
      //   { id: '1740602499999', name: 'The Math', topics: [] },
      // ],
      isOverSpace: null,
      isNew: false,
      localSpaces: [],
      localTopics: [],
    }
  },

  methods: {
    addTopic() {
      this.newTopic.id = this.newID
      this.topics.push(this.newTopic)
      this.addingTopic = false
    },

    removeSpace(index) {
      if (confirm(`Delete? ${index.name}`)) {
        this.localSpaces.splice(index, 1)
      }
    },

    onAddToZone(evt) {
      console.log('VueDraggable @add event:', evt)
      if (evt.item) {
        const topic = this.zone[this.zone.length - 1] // Get last added topic
        console.log('Dropped topic to zone:', topic)
        const space = {
          id: Date.now(),
          name: '',
          topics: [topic],
        } // Space name as input
        this.localSpaces.unshift(space)
        this.isNew = true
        this.zone = [] // Clear the zone after adding a space
      }
    },
    resetDraggingState() {
      this.isDraggingSpace = false
      this.isNew = false
    },
    setDropTarget(spaceId) {
      console.log('Hovering over space:', spaceId)
      this.isOverSpace = spaceId
    },
    clearDropTarget() {
      this.isOverSpace = null
    },
    resetCursor() {
      document.body.style.cursor = 'default'
    },
  },

  watch: {
    addingTopic(val) {
      if (val) {
        this.newID = String(Date.now())
      }
    },
  },
}
</script>

<style>
.space-name-input {
  border: none;
  font-size: 1rem;
  font-weight: bold;
  background: transparent;
  outline: none;
}
.container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
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
  background: #a7cde1;
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
  background: #dbeafe;
  text-align: center;
  margin-bottom: 10px;
}
.spaces-list {
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
  opacity: 0.5;
  background: #f1f1f1;
}
.topic-chip {
  background: #ffeb3b;
  color: #000;
  font-weight: bold;
}
</style>

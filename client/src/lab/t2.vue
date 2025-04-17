<template>
  <div class="container">
    <!-- Spaces Section -->
    <div class="spaces">
      <h3>Spaces</h3>
      <!-- Drop Zone for Topics -->
      <VueDraggable
        v-model="zone"
        class="drop-zone"
        v-bind="dropZoneDragOptions"
        @change="onDropToZone"
        @end="resetCursor"
      >
        <p>Drop Topics here to create a new Space</p>
      </VueDraggable>

      <!-- Spaces List (Sortable) -->
      <VueDraggable v-model="spaces" v-bind="spacesDragOptions" class="spaces-list">
        <transition-group name="fade" tag="div">
          <div
            v-for="(space, index) in spaces"
            :key="space.id"
            class="space-item"
            :class="{ 'drop-hover': isOverSpace === space.id }"
            @dragenter="setDropTarget(space.id)"
            @dragleave="clearDropTarget"
          >
            {{ space.name }}
            <button @click="removeSpace(index)">✖</button>

            <!-- Draggable Topics within each Space (Sortable) -->
            <VueDraggable v-model="space.topics" v-bind="topicsDragOptions">
              <v-chip v-for="topic in space.topics" :key="topic.id" class="topic-chip">
                {{ topic.name }}
              </v-chip>
            </VueDraggable>
          </div>
        </transition-group>
      </VueDraggable>
    </div>

    <!-- Topics List (Sortable) -->
    <v-col>
      <v-card class="pa-3">
        <v-card-title>Topics</v-card-title>
        <VueDraggable v-model="Topics" v-bind="topicsDragOptions">
          <v-card v-for="topic in Topics" :key="topic.id" class="draggable-item">
            {{ topic.name }}
            <br />
            {{ topic.summary }}
          </v-card>
        </VueDraggable>
        <v-btn block color="secondary" @click="setIntentAndAdd('Topics')"> ➕ Add Topic </v-btn>
      </v-card>
    </v-col>
  </div>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'

export default {
  components: { VueDraggable },
  computed: {
    dropZoneDragOptions() {
      return {
        group: {
          name: 'dropzone', // Allows only topics to be dropped here
          pull: false, // Items can't be dragged *out* of the Drop Zone
          put: ['topics'], // Only Topics can be dropped
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
          pull: 'clone', // Allow dragging topics into spaces
          put: true, // Allow dropping topics into spaces
        },
        animation: 200,
        fallbackOnBody: false,
        ghostClass: 'dragging-item',
      }
    },
    spacesDragOptions() {
      return {
        group: {
          name: 'spaces', // Allow sorting spaces but keep them separate from topics
          pull: 'clone',
          put: true,
        },
        animation: 300,
        fallbackOnBody: false,
        ghostClass: 'dragging-item',
      }
    },
  },

  data() {
    return {
      zone: [],
      Topics: [
        { id: 3, name: 'T1', summary: 'none' },
        { id: 4, name: 'T2', summary: 'none' },
        { id: 5, name: 'T3', summary: 'none' },
      ],
      spaces: [
        { id: 's1', name: 'S1', topics: [] },
        { id: 's2', name: 'S2', topics: [] },
      ],
      isOverSpace: null,
    }
  },
  methods: {
    removeSpace(index) {
      this.spaces.splice(index, 1)
    },
    onDropToZone(evt) {
      if (evt.data) {
        const topic = evt.data
        console.log('Dropped topic to zone:', topic)
        const name = `S${this.spaces.length + 1}`
        const space = { id: Date.now(), name, topics: [topic] }
        console.log(`Pushed ${topic} to ${name}`)
        this.spaces.push(space)
      }
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
}
</script>

<style>
.container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
}
.spaces,
.topics {
  width: 45%;
  padding: 20px;
  border: 1px solid #ccc;
  background: #f9f9f9;
}
.drop-zone {
  padding: 20px;
  border: 2px dashed #007bff;
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

<template>
  <v-container>
    <v-row>
      <!-- Draggable Spaces -->
      <v-col>
        <v-card-title>Spaces</v-card-title>
        <v-card class="mx-7" height="100" outlined color="blue lighten-4">
          <v-card-title>Drop Topics here...</v-card-title>
          <v-card-text>
            <div id="target" @drop="dropHandler(event)" @dragover="promptNewSpace(event)">
              ...or in a Space below
            </div>
          </v-card-text>
        </v-card>
        <v-card class="pa-3">
          <VueDraggable
            v-model="Spaces"
            :group="'topics'"
            animation="200"
            @choose="logEvent('spaces:choose', $event)"
            @clone="logEvent('spaces:clone', $event)"
            @remove="logEvent('spaces:remove', $event)"
            @change="logEvent('spaces:change', $event)"
            @start="logEvent('start', $event)"
            @move="logEvent('spaces:move', $event)"
            @add="logEvent('spaces:add', $event)"
            @update="logEvent('spaces:update', $event)"
            @end="logEvent('spaces:end', $event)"
          >
            <v-card v-for="space in Spaces" :key="space.id" class="draggable-item">
              {{ space.name }}
              <button @click="removeItem('Spaces', index)">❌</button>
              <v-chip v-for="topic in space.topics" :key="topic.id" class="topic-chip">
                {{ topic.name }}
              </v-chip>
            </v-card>
          </VueDraggable>
        </v-card>
      </v-col>

      <!-- Draggable Topics -->
      <v-col>
        <v-card class="pt-0">
          <v-card-title>Topics</v-card-title>
          <VueDraggable
            v-model="Topics"
            :group="{ name: 'topics', pull: 'clone', put: true }"
            animation="200"
            @choose="logEvent('topics:choose', $event)"
            @clone="logEvent('topics:clone', $event)"
            @remove="logEvent('topics:remove', $event)"
            @change="logEvent('topics:change', $event)"
            @start="logEvent('topics:start', $event)"
            @move="logEvent('topics:move', $event)"
            @add="logEvent('topics:add', $event)"
            @update="logEvent('topics:update', $event)"
            @end="logEvent('topics:end', $event)"
          >
            <v-card v-for="item in Topics" :key="item.id" class="draggable-item">
              {{ item.name }}
              <button @click="removeItem('Topics', index)">❌</button>
            </v-card>
          </VueDraggable>
          <v-btn block color="secondary" @click="addItem('Topics')">➕ Add to Topics</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Event History Debug Panel -->
    <v-row>
      <v-col>
        <v-card class="pa-3 debug-panel">
          <v-card-title>VD+ Event Log</v-card-title>
          <v-data-table
            :headers="logHeaders"
            :items="logEntries"
            item-value="timestamp"
            sort-by="timestamp"
            class="event-table"
            dense
          >
            <template slot="item.eventName" slot-scope="{ item }">
              <strong>{{ item.eventName?.toUpperCase() }}</strong>
            </template>

            <template slot="item.item" slot-scope="{ item }">
              <code>{{ item.item || 'N/A' }}</code>
            </template>

            <template slot="item.from" slot-scope="{ item }">
              <code>{{ item.from || 'N/A' }}</code>
            </template>

            <template slot="item.to" slot-scope="{ item }">
              <code>{{ item.to || 'N/A' }}</code>
            </template>

            <template slot="item.oldIndex" slot-scope="{ item }">
              <code>{{ item.oldIndex !== undefined ? item.oldIndex : 'N/A' }}</code>
            </template>

            <template slot="item.newIndex" slot-scope="{ item }">
              <code>{{ item.newIndex !== undefined ? item.newIndex : 'N/A' }}</code>
            </template>

            <template slot="item.timestamp" slot-scope="{ item }">
              <code>{{ new Date(item.timestamp).toLocaleTimeString() }}</code>
            </template>
          </v-data-table>
        </v-card>

        <jsonLens :value="getData()" title="debugMap" />
        <jsonLens :value="Spaces" title="Spaces" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'
import { Audit } from '@/js/helpers'
import jsonLens from '@/syntopix/components/jsonLens.vue'

export default {
  name: 'vdplus2.vue',

  components: { VueDraggable, jsonLens },

  data() {
    return {
      array: [],
      Spaces: [
        { id: 1, name: 'S1' },
        { id: 2, name: 'S2' },
      ],
      Topics: [
        { id: 3, name: 'T1' },
        { id: 4, name: 'T2' },
        { id: 5, name: 'T3' },
      ],
      nextId: 5,
      debugMap: new Map(), // 🔥 Stores event history efficiently
      logHeaders: [
        { text: 'Event', value: 'eventName' },
        { text: 'Item', value: 'item' },
        { text: 'From', value: 'from' },
        { text: 'To', value: 'to' },
        { text: 'Old Index', value: 'oldIndex' },
        { text: 'New Index', value: 'newIndex' },
        { text: 'Timestamp', value: 'timestamp' },
      ],
      logEntries: [], // This will be updated by logEvent()
      eventCounter: 1, // 🔥 Starts at 1 and increments with each event
    }
  },
  methods: {
    onEnd(event) {
      this.logEvent('end', event)
      prompt('space?')
    },

    getData() {
      return Array.from(this.debugMap).map((v) => v)
    },

    promptNewSpace(topicElement) {
      if (!topicElement) return
      const topicName = topicElement.name

      const spaceName = prompt(`Space for ${topicName}`)
      if (!spaceName) return

      // 🚀 Create the new Space with the dragged Topic
      const newSpace = {
        id: this.nextId++,
        name: spaceName,
        topics: [{ id: Date.now(), name: topicName }],
      }

      this.Spaces.push(newSpace)
      console.log(`✅ Created Space '${spaceName}' with Topic '${topicName}'`)
    },

    dragoverHandler(ev) {
      ev.preventDefault()
      ev.dataTransfer.dropEffect = 'move'
    },
    dropHandler(ev) {
      ev.preventDefault()
      // Get the id of the target and add the moved element to the target's DOM
      const data = ev.dataTransfer.getData('application/my-app')
      ev.target.appendChild(document.getElementById(data))
    },
    logEvent(eventName, event) {
      console.log(`📌 ${eventName} Event:`, event)

      const logEntry = {
        item: event.item ? event.item.innerText : 'N/A',
        from: event.from ? event.from.className : 'N/A',
        to: event.to ? event.to.className : 'N/A',
        oldIndex: event.oldIndex,
        newIndex: event.newIndex,
        timestamp: new Date().toISOString(),
      }

      this.debugMap.set(eventName, logEntry)
      // ✅ Properly extract values into a **flat array of objects**
      this.logEntries = Array.from(this.debugMap.values()).flatMap((entries) => entries)

      Audit.add({ fnc: eventName, ...logEntry })
      Audit.report()
      // if (eventName === 'end' || eventName === 'clone') {
      //   this.promptNewSpace(event.data);
      // }
    },

    addItem(list) {
      const newItem = { id: this.nextId++, name: `New Item ${this.nextId}` }
      if (list === 'Spaces') {
        this.Spaces.push(newItem)
      } else {
        this.Topics.push(newItem)
      }

      console.log(`➕ Added ${newItem.name} to List ${list}`)
    },
    removeItem(list, index) {
      if (list === 'Spaces') {
        this.Spaces.splice(index, 1)
        this.logEvent('delete-Spaces', { deletedIndex: index })
      } else if (list === 'Topics') {
        this.Topics.splice(index, 1)
        this.logEvent('delete-Topics', { deletedIndex: index })
      }
    },
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleTimeString()
    },
  },
  watch: {
    // Spaces() {
    //   this.logEvent('Changes Spaces');
    // },
    // Topics() {
    //   this.logEvent('Changed Topics');
    // },
  },
}
</script>

<style scoped>
.draggable-item {
  padding: 10px;
  margin: 5px;
  background: #90caf9;
  border-radius: 5px;
  cursor: grab;
  text-align: center;
}

/* Debug Panel */
.debug-panel {
  overflow-y: auto;
  background: #f5f5f5;
}
.log-container {
  padding: 10px;
}
.log-entry {
  padding: 5px;
  border-bottom: 1px solid #ccc;
  font-size: 0.9em;
}
</style>

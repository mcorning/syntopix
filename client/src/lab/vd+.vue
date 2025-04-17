<template>
  <v-container fluid>
    <v-row>
      <!-- Spaces List (Can Receive Topics) -->
      <v-col>
        <v-card class="pa-3">
          <v-card-title>Spaces</v-card-title>

          <!-- <v-card class="mx-7" height="100" outlined color="blue lighten-4">
            <v-card-title>Drop Topics here...</v-card-title>
            <v-card-text>
              <div id="target" @drop="dropHandler" @dragover="dragoverHandler">
                ...or in a Space below
              </div>
            </v-card-text>
          </v-card> -->
          <VueDraggable
            v-model="zone"
            :group="{ name: 'topics', pull: true, put: true }"
            animation="200"
            @end="dropHandler2($event)"
          >
            <div id="target" class="drop-zone">Drop into Space</div>
          </VueDraggable>

          <v-card
            v-for="space in Spaces"
            :key="space.id"
            class="draggable-item space-card ma-7"
            :class="{ 'drop-hover': isOverSpace === space.id }"
            @dragenter="setDropTarget($event, space.id)"
            @dragleave="clearDropTarget"
          >
            <strong>{{ space.name }}</strong>
            <VueDraggable
              v-model="space.topics"
              :group="{ name: 'topics', pull: cloning, put: true }"
              class="topic-container"
            >
              <v-chip v-for="topic in space.topics" :key="topic.id" class="topic-chip">
                {{ topic.name }}
              </v-chip>
            </VueDraggable>
          </v-card>
        </v-card>
      </v-col>

      <!-- Topics List -->
      <v-col>
        <v-card class="pa-3">
          <v-card-title>Topics</v-card-title>
          <VueDraggable
            v-model="Topics"
            :group="{ name: 'topics', pull: 'clone', put: true }"
            animation="200"
            @choose="logEvent('topics', 'choose', $event)"
            @clone="logEvent('topics', 'clone', $event)"
          >
            <v-card v-for="topic in Topics" :key="topic.id" class="draggable-item">
              {{ topic.name }}
              <br />
              {{ topic.summary }}
            </v-card>
          </VueDraggable>
          <v-btn block color="secondary" @click="setIntentAndAdd('Topics')">➕ Add Topic</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Event Log Table -->
    <v-row class="pt-10 pb-0" no-gutters>
      <!-- Intent Selection -->
      <v-col cols="3">
        <v-select
          v-model="currentIntent"
          :items="predefinedIntents"
          label="Current Intent"
          outlined
          dense
          clearable
        />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <v-card class="pa-3 debug-panel">
          <v-card-title>VD+ Event Log (By Intent)</v-card-title>
          <v-card-subtitle>{{ this.currentIntent }}</v-card-subtitle>

          <v-data-table
            :headers="logHeaders"
            :items="logEntries"
            sort-by="timestamp"
            group-by="intent"
            class="elevation-1"
          >
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    <Dialogs
      defaultSpaceName="S1"
      :selectedTopicID="selectedTopicID"
      :newSpaceDialog="newSpaceDialog"
      @new-space-name="newSpaceName"
      @close-new-space-dialog="closeDialog"
    />
  </v-container>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'
import { Audit } from '@/js/helpers'
import Dialogs from '@/syntopix/views/Dialogs.vue'

export default {
  name: 'vdplus.vue',
  components: { VueDraggable, Dialogs },
  computed: {
    filteredLogEntries() {
      const intent = this.selectedIntent || this.currentIntent // ✅ Default to currentIntent
      return this.intentMap.get(intent) || []
    },
    cloning() {
      return this.cloneMe ? 'clone' : true
    },
  },

  data() {
    return {
      zone: [],
      newSpaceBuffer: [],

      isOverSpace: null, // Tracks the Space being hovered

      currentIntent: '',
      selectedIntent: '',
      predefinedIntents: [
        'reorder',
        'move to Space',
        'move between Spaces',
        'delete',
        'add',
        'drop into Space',
      ],
      Spaces: [
        { id: 1, name: 'S1', topics: [] },
        { id: 2, name: 'S2', topics: [] },
      ],
      Topics: [
        { id: 3, name: 'T1', summary: 'none' },
        { id: 4, name: 'T2', summary: 'none' },
        { id: 5, name: 'T3', summary: 'none' },
      ],
      nextId: 6,
      debugMap: new Map(),
      intentMap: new Map(),
      logHeaders: [
        { text: 'Event', value: 'eventName' },
        { text: 'Item', value: 'item' },
        { text: 'From', value: 'from' },
        { text: 'To', value: 'to' },
        { text: 'Old Index', value: 'oldIndex' },
        { text: 'New Index', value: 'newIndex' },
        { text: 'Time', value: 'timestamp' },
      ],

      logEntries: [], // This will be updated by logEvent()
      cloneMe: false,
      newSpaceDialog: false,
      selectedTopicID: '',
    }
  },

  methods: {
    closeDialog() {
      console.warn('called closeDialog()')
      this.newSpaceDialog = false
    },
    newSpaceName(toSpace) {
      console.warn('called closeDialog()')
      this.toSpace = toSpace

      this.$emit('create-space', toSpace)

      this.closeDialog()
    },
    // createSpace() {
    //   const responseHandlers = {
    //     success: (response) => {
    //       Audit.add({ msg: `createSpace successful ${response.success}` });
    //       // Add any success logic here
    //     },
    //     prompt: (response) => {
    //       Audit.add({ msg: `User prompt required: ${response.prompt}` });
    //     },
    //     error: (response) => {
    //       Audit.add({ msg: `!!! ${response.error} ERROR in createSpace()` });
    //     },
    //     default: () => {
    //       console.warn('Unhandled response type');
    //     },
    //   };

    //   const respond = (response) => {
    //     console.log(`respond() called with`, response);

    //     const type = response.type || deriveResponseType(response); // Ensure type is derived
    //     const handler = responseHandlers[type] || responseHandlers.default;

    //     handler(response);
    //     Audit.report('Audit: Dialog.vue ');
    //   };

    //   const id = this.selectedTopicID;
    //   const toSpace = this.toSpace;

    //   Audit.add({
    //     intent: 'Create a Space',
    //     vue: 'Dialog',
    //     msg: 'Step One',
    //     function: 'createSpace()',
    //     id,
    //     fromSpace: null,
    //     toSpace,
    //     isClone: false,
    //   });

    //   this.$emit(
    //     'move',
    //     {
    //       toSpace,
    //       id,
    //     },
    //     respond
    //   );
    // },

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

    // Drop zone handlers
    dragoverHandler(event) {
      event.preventDefault() // Required to allow dropping
    },
    dropHandler(event) {
      event.preventDefault()
      const data = event.dataTransfer.getData('text/plain')
      console.log('Dropped data:', data)
    },
    dropHandler2(event) {
      event.preventDefault()
      const data = event.data
      this.selectedTopicID = data.name
      this.newSpaceDialog = true
    },

    logEvent(component, eventName, event, category) {
      console.log('event.data :>> ', event.data)
      const logEntry = {
        intent: this.currentIntent || 'No Intent',
        eventName,
        item: event.item ? event.item.innerText : 'N/A',
        from: event.from ? event.from.className : 'N/A',
        to: category || 'N/A',
        oldIndex: event.oldIndex,
        newIndex: event.newIndex,
        timestamp: new Date().toISOString(),
      }

      if (!this.debugMap.has(eventName)) {
        this.debugMap.set(eventName, [])
      }
      this.debugMap.get(eventName).unshift(logEntry)
      this.logEntries = Array.from(this.debugMap.values()).flatMap((entries) => entries)

      if (!this.intentMap.has(logEntry.intent)) {
        this.intentMap.set(logEntry.intent, [])
      }
      this.intentMap.get(logEntry.intent).unshift(logEntry)

      this.$nextTick(() => {
        this.selectedIntent = this.currentIntent
      })

      Audit.add({ fnc: component, category, ...logEntry })
      Audit.report()
      // if (eventName==='choose') {
      //   console.log(event.item);
      //   this.selectedTopicID = event.item.innerText;
      // }
      // else if (eventName==='clone') {
      //   this.newSpaceDialog = true;
      // }
    },

    setDropTarget(event, spaceId) {
      this.cloneMe = event.ctrlKey
      console.log('cloneMe :>> ', this.cloneMe)
      console.log('🟢 Entered Space:', spaceId)
      this.isOverSpace = spaceId
    },
    clearDropTarget(event) {
      if (!event.relatedTarget || !event.relatedTarget.closest('.space-card')) {
        console.log('🔴 Fully Left Space')
        this.isOverSpace = null
      } else {
        console.log('🟡 Still inside a Space')
      }
    },

    highlightDropTarget(space) {
      space.isHighlighted = true
    },
    clearDropTargetOnSpace(space) {
      space.isHighlighted = false
    },

    handleNewSpaceDrop(event) {
      const topic = event.item.__draggable_context.element

      if (topic) {
        const spaceName = prompt('Enter a name for the new Space:', `New Space ${this.nextSpaceId}`)
        if (spaceName) {
          const newSpace = {
            id: this.nextSpaceId++,
            name: spaceName,
            topics: [topic],
          }
          this.Spaces.push(newSpace)
          this.Topics = this.Topics.filter((t) => t.id !== topic.id)
          console.log(`Created new space '${spaceName}' and moved ${topic.name} into it.`)
        } else {
          console.log('Space creation canceled. Resetting drop state.')
          this.isOverSpace = null
          this.forceDropZoneReset()
        }
      }
    },

    forceDropZoneReset() {
      this.$nextTick(() => {
        this.isOverSpace = null
      })
    },

    handleMove(event) {
      if (!event || !event.to || !event.originalEvent) {
        console.warn('⚠️ Missing event data! Aborting move handling.')
        return false
      }

      const targetClass = event.to.className || ''

      if (!targetClass.includes('space-card')) {
        console.warn('❌ INVALID DROP - Not a valid Space!')
        event.originalEvent.dataTransfer.dropEffect = 'none'
        this.isOverSpace = null
        return false
      }

      this.isOverSpace = event.to.dataset.id || null
    },

    handleTopicDrop(event) {
      const topicId = event.data.id
      const topic = this.Topics.find((t) => t.id == topicId)
      const space = this.Spaces.find((s) => s.id === this.isOverSpace)

      if (!topic) return

      if (!space) {
        console.warn(`🚨 Topic '${topic.name}' removed from all Spaces. Deleting.`)
        this.Topics = this.Topics.filter((t) => t.id !== topic.id)
        this.logEvent('delete', event, 'Dragged out of Space')
        return
      }

      if (space.topics.find((t) => t.id === topic.id)) {
        console.warn(
          `⚠️ Topic '${topic.name}' already exists in '${space.name}'. Skipping duplicate.`
        )
        return
      }

      space.topics.push(topic)
      this.Topics = this.Topics.filter((t) => t.id !== topic.id)
      this.logEvent('drop into Space', event, space.name)
    },
  },

  watch: {
    array(array) {
      console.log('array', array)
    },
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
.log-entry {
  padding: 5px;
  border-bottom: 1px solid #ccc;
  font-size: 0.9em;
}

/* Improved visibility for Topics inside Spaces */
.topic-chip {
  background: #ffeb3b;
  color: #000;
  font-weight: bold;
}

/* Highlights Space when a valid Topic is dragged over */
.drop-hover {
  border: 2px dashed #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

/* Invalid drop zone */
.drop-hover.invalid {
  border-color: red !important;
  background-color: rgba(255, 0, 0, 0.1);
  cursor: no-drop;
}

/* Space card styling */
.space-card {
  position: relative;
  border: 2px solid transparent;
  transition: border-color 0.2s ease-in-out;
}

/* Min height for topic drop zones */
.topic-container {
  min-height: 40px;
  padding: 5px;
}
.drop-zone {
  border: 2px dashed #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
  padding: 10px;
  text-align: center;
  margin-bottom: 10px;
  min-height: 100px;
}
</style>

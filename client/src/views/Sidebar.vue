<template>
  <div>
    <aside class="sidebar" :style="{ width: `${sidebarVisible ? sidebarWidth : 0}px` }">
      <!-- Permanent Header -->
      <div class="header">
        <h2>Spaces</h2>
        <button class="close-btn" @click="toggleSidebar">X</button>
      </div>

      <!-- Subheader for Selected Space -->
      <div v-if="selectedSpace" class="subheader">
        <button class="back-btn" @click="backToSpaces">←</button>
        <button class="add-btn" :disabled="!selectedTopic" @click="addToSpace">+</button>
      </div>

      <!-- Drop Zone Component -->
      <VueDraggable :group="{ name: 'topics', pull: true, put: false }">
        <DropZone class="drop-zone" @drop="detectDragType($event)" />
      </VueDraggable>

      <!-- Big Space card -->
      <VueDraggable
        v-model="localSpaces"
        :group="{ name: 'spaces', pull: true, put: true }"
        @end="onReorderSpaces"
        @change="handleSidebarDrop"
      >
        <v-card
          v-for="space in localSpaces"
          class="space-card pa-4 mb-4"
          outlined
          :elevation="space.id === openSpace.id ? 8 : 2"
          :key="space.id"
          :class="{ 'space-open': openSpace.id === space.id }"
          @dragover.prevent
          @dragstart="onDragStart($event, { type: 'space', fromSpace: space.id })"
          @change="
            (event) =>
              handleIntent({
                intent: 'move',
                args: { event, toSpace: space.id },
              })
          "
          @click="toggleSpaceOpen(space)"
        >
          <v-card-title
            :class="{
              'space-open': space.isOpen,
              'space-closed': !space.isOpen,
            }"
          >
            {{ space.id }}
          </v-card-title>
          <VueDraggable
            v-if="openSpace.id === space.id"
            :list="space.topiqx"
            :group="{ name: 'topics', pull: 'clone', put: true }"
          >
            <v-card
              v-for="topic in uniqueTopics(space.topiqx)"
              :key="topic.id"
              class="topic-card"
              draggable="true"
              @dragstart="
                onDragStart($event, {
                  type: 'topic',
                  id: topic.id,
                  fromSpace: space.id,
                })
              "
              @end="onTopicsReordered(space)"
              @click="selectTopic(topic)"
            >
              <v-card-title>{{ topic.title }}</v-card-title>
              <v-card-text class="pb-1">{{ topic.summary }}</v-card-text>
              <v-card-text class="pt-0 text-caption">ID: {{ topic.id }}</v-card-text>
            </v-card>
          </VueDraggable>
        </v-card>
        <!-- End Big Space card -->
      </VueDraggable>
      <jsonLens class="text-caption" :value="localSpaces" title="localSpaces" />
    </aside>
    <!-- Dialogs Component -->
    <Dialogs
      :selectedTopicID="selectedTopicID"
      :newSpaceDialog="newSpaceDialog"
      :newSpaceName="newSpaceName"
      @close-new-space-dialog="closeNewSpaceDialog"
      @move="onMoveTopic"
    />
  </div>
</template>

<script>
import { Audit, clj, deriveResponseType, safeParseJSON } from '@/js/helpers.js'
import Dialogs from '@/syntopix/views/Dialogs.vue'
import jsonLens from '@/syntopix/components/jsonLens.vue'
import DropZone from './DropZone.vue'
import { VueDraggable } from 'vue-draggable-plus'
export default {
  name: 'Sidebar',
  components: { VueDraggable, Dialogs, jsonLens, DropZone },

  props: {
    openSpace: {
      type: Object, // Open Space with ID and topix fields
      default: () => ({ id: '', topix: [] }),
    },
    spaces: {
      type: Array, // Array of Space objects
      required: true, // This is essential for Sidebar functionality
    },
    localSpaceTopics: {
      type: Array, // Object containing topics by Space ID
      default: () => [], // Ensure default is a reactive empty object
    },
    selectedSpace: {
      type: String, // Currently selected Space ID or name
      default: null,
    },
    selectedTopic: {
      type: String, // Currently selected Topic ID
      default: null,
    },
    spaceGroup: {
      type: String, // Group/category identifier for Spaces
      default: '', // Default to an empty string
    },
    sidebarVisible: {
      type: Boolean, // Determines Sidebar visibility
      default: true, // Default to visible
    },
    sidebarWidth: {
      type: Number, // Width of the Sidebar in pixels
      default: 300, // Default width
    },
    isDuplicateDrop: {
      type: Boolean, // Indicates if a duplicate Topic is being dropped
      default: false, // Default to no duplicates
    },
  },
  computed: {
    isSpaceOpen() {
      return (spaceId) => this.openSpace.id === spaceId
    },

    isClone() {
      return (event) => event.ctrlKey // Clone when Ctrl is pressed
    },
    dropClass() {
      return (space) => {
        if (!this.draggedTopic) return 'drop-allowed'
        const isDuplicate = space.topiqx.some((topic) => topic.id === this.draggedTopic.id)
        return isDuplicate ? 'drop-not-allowed' : 'drop-allowed'
      }
    },
  },

  data() {
    return {
      isHighlighting: false,

      payload: {
        type: '', // 'topic' | 'space' Explicitly tells the server what we are moving
        id: '', // ID of the Topic or Space being moved
        fromSpace: '', // Only used for topics; `null` for spaces
        toSpace: '', // Only used for topics; `null` for spaces
        position: [], // New position in the list (for reordering)
        action: '', //'move' | 'clone' | 'reorder' | 'delete' Defines the action being performed
      },
      newSpaceDialog: false,
      newSpaceName: '',
      pendingTopic: null,
      selectedTopicID: '',

      localSpaces: null,
      localTopics: [],
      isLoading: false,
    }
  },

  methods: {
    highlightDropZone() {
      document.querySelector('.drop-zone').classList.add('highlight')
    },
    removeHighlight() {
      document.querySelector('.drop-zone').classList.remove('highlight')
    },
    handleDrop(event) {
      this.removeHighlight() // Reset highlight

      const topicData = event.dataTransfer.getData('topic') // Extract Topic data
      if (!topicData) {
        console.warn('❌ No topic data found in event.')
        return
      }

      const parsedTopic = JSON.parse(topicData)
      console.log(`✅ Topic dropped in Drop Zone:`, parsedTopic)

      // 🚀 Now trigger the intent-based system
      this.handleIntent({
        intent: 'move',
        args: {
          id: parsedTopic.id,
          fromSpace: parsedTopic.fromSpace,
          toSpace: null,
        },
      })
    },
    handleSidebarDrop(event) {
      if (event.added) {
        const topicData = event.added.element // ✅ Extract full Topic
        this.promptNewSpace(topicData) // ✅ Trigger the "New Space" prompt
      }
    },
    promptNewSpace(topic) {
      console.log('Triggering New Space dialog for:', topic)
      this.$emit('prompt-new-space', topic)
    },
    detectDragType(payload) {
      const { spaceData, topicData } = payload
      Audit.add({ msg: 'detectDragType()', ...topicData })
      Audit.report

      // if dropping a new Topic, there is no event but args has the topic in data
      if (topicData.intent && topicData.intent === 'add') {
        this.selectedTopicID = topicData.id
        this.newSpaceDialog = true
      } else {
        console.warn(JSON.stringify(topicData, null, 2))
        const type = !topicData ? 'space' : 'topic'
        this.handleIntent({
          intent: 'move',
          args: { ...spaceData, ...topicData, type },
        })
      }
    },

    parseEvent(event) {
      const isClone = event?.ctrlKey ? 'clone' : 'move'
      const topic = safeParseJSON(event.dataTransfer.getData('topic')) // Retrieve Topic data from event
      return topic
        ? {
            id: topic.id,
            type: topic.type,
            action: isClone,
            fromSpace: topic.fromSpace,
            toSpace: topic.toSpace,
          }
        : {}
    },

    act(intent, args) {
      const label = `${intent} in`
      console.time(label)

      const responseHandlers = {
        success: (response) => {
          Audit.add({ msg: `${intent} Successful` })
          // ✅ If a Topic was moved from an open Space, ensure it stays open
          if (this.openSpace?.id && this.openSpace.id === response.fromSpace) {
            const msg = `Reopening Space ${response.fromSpace} after move`
            Audit.add({ msg })
            this.$emit('open-space', response.fromSpace)
          }
          // this really doesn't belong here
          if (response.toSpace) {
            const msg = `Expanding Space ${response.toSpace} after drop`
            Audit.add({ msg })
            this.$emit('open-space', response.toSpace)
          }
        },
        prompt: (response) => {
          console.warn(`User prompt required: ${response.prompt}`)
        },
        error: (response) => {
          console.error(`Failed to move topic: ${response.error}`)
        },
        default: () => {
          console.warn('Unhandled response type')
        },
      }

      const respond = (response) => {
        console.log(`respond() called with`, response)

        const type = response.type || deriveResponseType(response) // Fallback to derived type
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report(`Sidebar.${intent}`)
        console.timeEnd(label)
      }

      this.payload = args
      Audit.add({ ...args })
      Audit.report('Sidebar.act() to emit to Syntopix')

      this.$emit(intent, { ...this.payload }, respond)
    },

    handleIntent({ intent, args }) {
      Audit.add({ msg: `handleIntent() called`, intent, args })

      // 🔥 If this came from MainContent, extract data from event
      if (args.event) {
        const eventData = safeParseJSON(args.event.dataTransfer.getData('topic'))

        if (eventData) {
          Audit.add({
            msg: `Extracted event data: ${JSON.stringify(eventData)}`,
          })

          args = {
            ...args,
            id: eventData.id,
            title: eventData.title,
            summary: eventData.summary || '',
            fromSpace: eventData.fromSpace || null, // Could be null if new
            toSpace: args.toSpace, // Passed if dropped on a Space
          }
        } else {
          console.warn('handleIntent(): No valid topic data in event.')
        }
      }

      // 🔥 Ensure all drops on Spaces are treated as "move"
      if (args.toSpace) {
        intent = 'move'
      }

      const validIntents = {
        move: () => this.act('move', args),
        delete: () => this.act('delete', { id: args.id }),
      }

      if (validIntents[intent]) {
        validIntents[intent]()
      } else {
        console.warn(`Invalid intent received: ${intent}`)
      }
    },

    onMoveTopic({ id, fromSpace, toSpace, isClone }) {
      this.newSpaceDialog = false
      this.handleIntent({
        intent: 'move',
        args: { id, fromSpace, toSpace, isClone },
      })
    },
    closeNewSpaceDialog() {
      this.newSpaceDialog = false
    },
    // reordering Space cards
    onSpaceDragStart(event, topic) {
      console.log('Drag started for Topic:', topic.id)
      event.dataTransfer.setData('topic', JSON.stringify({ id: topic.id, type: 'space' }))
    },
    //topic or space drag data (used by DropZone's @end)
    onDragStart(event, { id, fromSpace, type }) {
      Audit.add({ msg: 'Drag started with payload:', id, fromSpace, type }) // Debugging
      Audit.report('onDragStart')
      event.dataTransfer.setData(type, JSON.stringify({ id, fromSpace }))
    },
    //#region utility methods

    js(json) {
      return JSON.stringify(json)
    },

    spaceIsOpen(spaceID) {
      console.log('spaceID :>> ', spaceID)
      console.log('this.openSpace :>> ', this.openSpace)
      return this.openSpace.id === spaceID
    },

    uniqueTopics(topics) {
      const seen = new Set()
      return topics.filter((topic) => {
        if (seen.has(topic.id)) {
          return false // Skip duplicate
        }
        seen.add(topic.id)
        return true // Include unique topic
      })
    },

    //#region For subheader Selection
    toggleSidebar() {
      this.$emit('toggle-sidebar')
    },
    backToSpaces() {
      this.$emit('back-to-spaces')
    },
    //#endregion

    openQrDialog(topic) {
      console.log('Opened QR dialog for topic:', topic)
      this.$emit('open-qr-dialog', topic)
    },

    editTopic(topic) {
      console.log('Edit topic:', topic)
    },
    addTopic(topic) {
      console.log('Add topic:', topic)
    },
    //#endregion

    /* Handle drop to:
        create a new space
        add to existing given space
        move Topic between Spaces
        delete a Topic from a Space
     */
    moveTopic(event, space) {
      console.log('space :>> ', space)
      console.time('moveTopic in')

      const responseHandlers = {
        success: (response) => {
          Audit.add({ msg: 'audit: Successfully moved topic' })
          if (response.toSpace) {
            const msg = `Expanding Space ${response.toSpace} after drop`
            Audit.add({ msg })
            this.$emit('open-space', response.toSpace)
          }
        },
        prompt: (response) => {
          console.warn(`audit: User prompt required: ${response.prompt}`)
        },
        error: (response) => {
          console.error(`audit: Failed to move topic: ${response.error}`)
        },
        default: () => {
          console.warn('audit: Unhandled response type')
        },
      }

      const respond = (response) => {
        console.log(`audit: respond() called with`, response)

        const type = response.type || deriveResponseType(response) // Fallback to derived type
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report('Sidebar.moveTopic()')
        console.timeEnd('moveTopic in')
      }

      const { id, fromSpace, action } = this.parseEvent(event)
      // space is null if Topic drops in zone
      const toSpace = space?.id
      Audit.add({
        intent: 'Move Topic',
        vue: 'Sidebar',
        msg: 'Step One',
        function: 'moveTopic()',
        id,
        fromSpace,
        toSpace,
        action,
      })

      if (!action) {
        console.warn('Cannot move Topic if there is no Topic to move')
        return
      }

      this.$emit('move-topic', { id, fromSpace, toSpace, action }, respond)
    },

    toggleSpaceOpen(space) {
      const newOpenSpace = this.openSpace?.id === space.id ? { id: '', topix: [] } : space
      this.$emit('update:openSpace', newOpenSpace) // Notify parent
    },

    onTopicsReordered(space) {
      const newOrder = space.topiqx.map((topic) => topic.id) // Collect topic IDs
      console.log(`Emitting reordered topics for space [${space.id}] :`, newOrder)
      this.$emit('reorder-topics', { spaceId: space.id, newOrder })
    },

    onReorderSpaces(event) {
      const { newIndex, oldIndex } = event

      // Check if the dragged Space was dropped in the Drop Zone
      const isDroppedInZone = event.to.classList.contains('drop-zone')

      if (isDroppedInZone) {
        const spaceToDelete = this.localSpaces[oldIndex]
        console.log('Deleting Space:', spaceToDelete)
        this.handleIntent({
          intent: 'delete',
          args: { id: spaceToDelete.id, type: 'space' },
        })
      } else {
        console.log(`Reordered space from ${oldIndex} to ${newIndex}`)
        this.$emit('reorder-spaces', { newIndex, oldIndex })
      }
    },

    addToSpace() {
      if (this.selectedSpace && this.selectedTopic) {
        this.$emit('add-topic-to-space', {
          id: this.selectedTopic.id,
          toSpace: this.selectedSpace,
        })
      }
    },
    deleteSpace(space) {
      console.log(`Deleting space: ${space.id}`)
      this.$emit('delete-space', space.id)
    },

    onTopicsChanged(space) {
      console.log('Topics changed in space:', space.id)
      this.$emit('spaces-updated', this.spaces)
    },

    selectTopic(topic) {
      console.log('Selected topic:', topic)
      this.$emit('select-topic', topic)
    },
  },

  watch: {
    localSpaces(localSpaces, old) {
      console.log('localSpaces :>> ', localSpaces)
      console.log('old localSpaces :>> ', old)
      console.log()
    },
    spaces(spaces) {
      console.log('spaces :>> ', spaces)
      this.localSpaces = [...this.spaces] // makes spaces mutable for ordering
      clj(this.localSpaces, 'this.localSpaces :>> ')
      console.log()
    },

    openSpace(openSpace, closedSpace) {
      console.log('openSpace :>> ', openSpace.id)
      console.log('closedSpace :>> ', closedSpace.id)
      console.log()
    },
    localSpaceTopics(localSpaceTopics) {
      console.log('localSpaceTopics :>> ', localSpaceTopics)
      this.localTopics = localSpaceTopics
      console.log('Not sure we need this watcher')
    },
  },

  mounted() {
    console.log('Sidebar mounted')
    this.isLoading = true
    console.log('spaces :>> ', this.spaces)
    console.log(' ')
  },
}
</script>

<style scoped>
.sidebar {
  height: auto;
  min-height: 100vh; /* At least full viewport height */
  overflow-y: visible; /* Ensure no hidden content */
  flex-grow: 1; /* Allow it to expand */

  background-color: #f4f4f4;
  padding: 1em;
  border-right: 1px solid #ccc;
  position: relative;
  transition: width 0.3s ease;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.subheader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1em;
}
.close-btn,
.back-btn,
.add-btn {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
}
.new-space-drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  padding: 30px;
  border: 2px dashed #1976d2;
  border-radius: 10px;
  background-color: #f5f5f5;
  transition: background-color 0.3s ease, transform 0.3s ease;
  cursor: pointer;
}
.new-space-drop-zone:hover {
  background-color: #e3f2fd;
  transform: scale(1.05);
}
.drop-zone-icon {
  color: #1976d2;
  margin-bottom: 10px;
}
.drop-zone-text {
  color: #1976d2;
  font-weight: bold;
  font-size: 16px;
}
.space-card {
  margin: 10px 0;
  cursor: pointer;

  border-radius: 16px; /* Smooth rounded corners */
  background-color: #f9f9f9; /* Subtle background color */
  transition: box-shadow 0.3s ease; /* Add hover effect */
}

.space-open {
  font-weight: bold;
}
.space-closed {
  font-style: italic;
  color: #888;
}
.topic-card {
  background-color: lightblue;
  border: 1px solid #ddd;
  margin: 5px 0;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
}
.drop-allowed {
  border: 2px solid green;
}

.drop-not-allowed {
  border: 2px solid red;
  pointer-events: none; /* Prevent dropping */
}

.space-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Subtle hover shadow */
}

.space-card .v-card-title {
  font-size: 1.2rem; /* Slightly larger title */
  font-weight: 600; /* Make title bold */
}

.space-card .v-card-subtitle {
  font-size: 0.9rem; /* Smaller subtitle */
  color: #757575; /* Muted subtitle color */
}
.space-card:hover {
  background-color: #8ac1e9;
  transform: scale(1.05);
}
.drop-zone {
  width: 100%;
  height: 150px;
  margin: 20px 0;
  background: rgba(25, 118, 210, 0.1); /* Light blue */
  border: 2px dashed #1976d2;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
  color: #1976d2;
  transition: background 0.3s ease-in-out;
}
.drop-zone.highlight {
  background: rgba(25, 118, 210, 0.2);
}
</style>

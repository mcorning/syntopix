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
                    <v-btn @click="$emit('edit-topic', topic)" text> Edit</v-btn>
                    <v-spacer />
                    <v-btn @click="deleteTopic(topic)" text> Delete</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </VueDraggable>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="8">
        <pre class="text-caption">
  topicStreamKey: '19:syntopix:topics:stream',
  pkTopicsKey: '19:syntopix:pks:1737853219224-0:topics',
  pkSpacesKey: '19:syntopix:pks:1737853219224-0:spaces',
  spaceOrderKey: '19:syntopix:pks:1737853219224-0:spaces:order',

  topicContentKey: '19:syntopix:topics:content',
  topicSpaceKey: '19:syntopix:topics:spaces',
  topicOrderKey: '19:syntopix:spaces:topics:order',

  spaceKey: '19:syntopix:spaces:1737853219224-0',
  pk: '1737853219224-0'
</pre
        >
      </v-col>
      <v-col cols="4">
        <pre class="text-caption">
    edit
      Space name
      Topics
            </pre
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'
import { Audit, dateFromID, deriveResponseType, isEmpty } from '@/js/helpers.js'

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
    dropZoneDragOptions() {
      return {
        group: {
          name: 'dropzone',
          pull: true,
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
    spaceTopicsDragOptions() {
      return {
        group: {
          name: 'topics',
          pull: true, // Allow moving topics between spaces
          put: ['topics'], // Allow adding topics to a space
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
      newSpace: { name: '' },
      newID: '',
      newTopic: { id: '', title: '', summary: '', isPrivate: true },
      addingTopic: false,
      isDraggingSpace: false,
      zone: [],
      localSpaces: [],
      localTopics: [],
      testTopics: [
        {
          id: '1740602498070-0',
          title: 'Abstract',
          summary: 'We introduce Practical Computation',
          isPrivate: true,
        },
        {
          id: '1740602498000-0',
          title: 'Layer 1: Data',
          summary: 'Records, Repository, and Recall',
          isPrivate: true,
        },
        {
          id: '1740602498123-0',
          title: 'Later 2: Truth',
          summary: 'The Truth about the Truth',
          isPrivate: true,
        },
        {
          id: '1740602408160-0',
          title: 'Later 3: Trust',
          summary: 'Measuring Trust',
          isPrivate: true,
        },
      ],
      testSpaces: [
        {
          id: '1740602498070',
          name: 'Major Ideas',
          topics: [
            {
              id: 3,
              name: 'Abstract',
              summary: 'We introduce Practical Computation',
            },
          ],
        },
        { id: '1740602499999', name: 'The Math', topics: [] },
      ],
      isOverSpace: null,
      isNew: false,
    }
  },

  methods: {
    wordCount(topic) {
      if (!topic.content) return 0
      return topic.content.trim().split(/\s+/).length
    },

    loadtinyEditor(topic) {
      const { title, id } = topic
      if (!title) {
        return
      }
      this.selectedtopicID = id
      // jl3(
      //   'loadEditor()  selectedEditTab',
      //   this.editTab.at(this.selectedEditTab)
      // );
      const vidLabel = this.vidLabel
      this.$router.push({
        // name: this.editTab.at(this.selectedEditTab).path,
        name: 'Tensor.Topic',
        params: { id, vidLabel },
      })
    },
    deleteTopic(topic) {
      this.deleteObject('topic', topic)
    },
    deleteSpace(space) {
      this.deleteObject('space', space)
    },
    deleteObject(type, target) {
      this.$emit('delete-object', { type, target })
    },

    onTopicsReordered() {
      const newTopicOrder = this.localTopics // Collect topic IDs
      console.clear()
      console.log(
        `Emitting reordered topics `,
        newTopicOrder.map((v) => v.title)
      )
      this.$emit('reorder-topic-cards', { newTopicOrder })
    },
    removeSpaceFromTopic(topic, space) {
      console.log('topic, :>> ', { ...topic })
      console.log('space :>> ', space)
      console.log(`Removing ${space} from Topic ${topic.id}'s spaces array'`)
      this.$emit('remove-space-from-topic', {
        topicId: topic.id,
        fromSpace: space,
      })
    },
    expandDropZone(spaceId) {
      this.isOverSpace = spaceId
    },

    resetDraggingState() {
      this.isOverSpace = null
    },
    createdOn(id) {
      return dateFromID(id)
    },

    // called by Add Topic button on Topics
    addTopic() {
      const responseHandlers = {
        success: (response) => {
          Audit.add({
            msg: `addTopic() successful ${response.success}`,
          })
          // Add any success logic here
        },
        prompt: (response) => {
          Audit.add({ msg: `User prompt required: ${response.prompt}` })
        },
        error: (response) => {
          Audit.add({
            msg: `!!! ${response.error} ERROR in addTopic()`,
          })
        },
        default: () => {
          console.warn('Unhandled response type')
        },
      }

      const respond = (response) => {
        const type = response.type || deriveResponseType(response) // Ensure type is derived
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report('Audit: Adding Topic ')
      }
      if (this.newTopic.title.trim()) {
        this.$emit('add-topic', this.newTopic, respond)
      }
      this.addingTopic = false
    },

    // @add on zone dragging from Topics
    // NOOP on deleting topic from space card
    promptForSpace(evt) {
      evt.preventDefault()
      const topic = evt.data
      if (!topic) {
        console.warn('⚠️ Invalid drop detected.')
        return
      }

      // Emit event to open the space creation dialog in `Syntopix.vue`
      this.$emit('open-space-dialog', topic.id)
    },
    openDeleteDialog(type, id) {
      this.deleteType = type
      this.deleteId = id
      this.localDeleteDialog = true
    },
    removeSpace(space) {
      this.openDeleteDialog('Space', space.id)
    },
    removeTopic(topic) {
      this.openDeleteDialog('Topic', topic.id)
    },

    // called when dragging from Topics to zone
    createSpace() {
      const responseHandlers = {
        success: (response) => {
          Audit.add({ msg: `createSpace successful ${response.success}` })
          // Add any success logic here
        },
        prompt: (response) => {
          Audit.add({ msg: `User prompt required: ${response.prompt}` })
        },
        error: (response) => {
          Audit.add({ msg: `!!! ${response.error} ERROR in createSpace()` })
        },
        default: () => {
          console.warn('Unhandled response type')
        },
      }

      const respond = (response) => {
        const type = response.type || deriveResponseType(response) // Ensure type is derived
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report('Audit: Dialog.vue ')
      }

      const newSpaceId = this.newSpace.name
      // assumes a push for the latest Topic
      const topicId = this.newSpace.topics[0].id
      Audit.add({
        intent: 'Create a Space',
        vue: 'SpaceMan',
        msg: 'Step One',
        function: 'createSpace()',
        topicId,
        fromSpace: null,
        newSpaceId,
        isClone: false,
      })

      this.$emit('add-space-to-topic', { topicId, newSpaceId }, respond)
    },

    /**
     * Called from drop zone and space.topics draggables
     * Handles both adding and removing topics from a space.
     */
    manageTopicSpaces({ topic, to, from }) {
      console.log('topic :>> ', topic.title)
      console.log('to :>> ', to)
      console.log('from :>> ', from)
      console.log()

      const responseHandlers = {
        success: (response) => {
          Audit.add({
            msg: `manageTopicSpaces successful ${response.success}`,
          })
          // Add any success logic here
        },
        prompt: (response) => {
          Audit.add({ msg: `User prompt required: ${response.prompt}` })
        },
        error: (response) => {
          Audit.add({
            msg: `!!! ${response.error} ERROR in manageTopicSpaces()`,
          })
        },
        default: () => {
          console.warn('Unhandled response type')
        },
      }

      const respond = (response) => {
        const type = response.type || deriveResponseType(response) // Ensure type is derived
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report('Audit: Adding Space to Topic ')
      }
      this.$emit('add-space-to-topic', { topicId: topic.id, newSpaceId: to || from }, respond)
    },

    handleTopicRemoval(event, space) {
      const topicId = event.data.id
      const index = space.topics.findIndex((t) => t.id === topicId)

      if (index !== -1) {
        space.topics.splice(index, 1) // Properly remove the topic
      }
    },
  },

  watch: {
    localTabTopics: {
      handler(newTopics) {
        if (isEmpty(newTopics)) {
          console.warn('No new Topics')
          this.addingTopic = true
          return
        }
        console.log(`localTabTopics updated with ${newTopics.length} Topics`)
        this.localTopics = newTopics
        // Map to render Spaces with their assigned Topics
        const spacesMap = new Map()

        newTopics.forEach((topic) => {
          if (!Array.isArray(topic.spaces) || topic.spaces.length === 0) {
            console.warn(`⚠️ Topic "${topic.title}" has NO spaces. Skipping.`)
            return // Don't create spaces if no topics exist
          }

          topic.spaces.forEach((space) => {
            if (!spacesMap.has(space)) {
              spacesMap.set(space, { id: space, name: space, topics: [] })
            }
            spacesMap.get(space).topics.push({
              id: topic.id,
              title: topic.title,
              content: topic.content,
            })
          })
        })

        // Convert map to array and update localSpaces
        this.localSpaces = Array.from(spacesMap.values())
      },
      deep: true, // Watch for nested changes
    },

    addingTopic(val) {
      if (val) {
        this.newID = String(Date.now())
      }
    },
  },

  mounted() {},
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
  min-height: 80px; /* Increase base height */
  padding: 10px;
  transition: min-height 0.2s ease-in-out;
}

.topics-drop-container:has(.dragging-item) {
  min-height: 120px; /* Expand when a topic is dragged over */
}
.expanded-drop-zone {
  min-height: 150px !important; /* More space when dragging over */
  background: rgba(0, 123, 255, 0.1);
  border: 2px dashed #007bff;
}

.spaces-list {
  min-height: 200px; /* Prevent collapsing */
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
  width: 250px !important; /* Ensures normal width */
  min-width: 250px !important;
  opacity: 0.8; /* Slight transparency for effect */
  transform: scale(1); /* Prevents shrinking */
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
/* Remove highlight from Topics */
.topics-drop-zone {
  padding: 7px;
  background: none !important;
  border: none !important;
}
.topic-col {
  min-width: 250px; /* Ensures each topic is at least 250px wide */
}

.topic-card {
  display: flex;
  flex-direction: column;
  min-width: 200px; /* Prevents excessive shrinking */
  flex-grow: 1;
}
</style>

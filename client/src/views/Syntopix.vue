<template>
  <v-container fluid fill-height>
    <div v-if="!hasTopics">No topics available. Try refreshing.</div>

    <div class="layout">
      <SpaceMan
        v-if="!test"
        :spaces="spaces"
        :localSpaceTopics="localSpaceTopics"
        :selectedSpace="selectedSpace"
        :selectedTopic="selectedTopic"
        :sidebarVisible="sidebarVisible"
        :sidebarWidth="sidebarWidth"
        :openSpace="openSpace"
        :localTabTopics="localTabTopics"
        @add-topic="addTopic"
        @update:openSpace="setOpenSpace"
        @fetch-topics-for-space="fetchTopicsForSpace"
        @move="handleIntent"
        @X-delete-space="deleteSpace"
        @select-space="selectSpace"
        @delete-topic-from-space="onDeleteTopicFromSpace"
        @reorder-spaces="reorderSpaces"
        @reorder-topics="saveTopicOrder"
        @update-spaces="updateSpaces"
        @create-space="createSpace"
        @add-space-to-topic="addSpaceToTopic"
        @remove-space-from-topic="removeSpaceFromTopic"
        @delete-space-from-topics="deleteSpaceFromTopics"
        @reorder-topic-cards="reorderTopicCards"
        @open-space-dialog="openSpaceDialog"
        @delete-space="openDeleteDialog"
        @delete-object="openDeleteDialog"
        @edit-topic="editTopic"
      />

      <SyntopixEditor :topic="editThisTopic" @save="saveTopicContent" />

      <!-- Dialogs Component -->
      <Dialogs
        :newSpaceDialog="newSpaceDialog"
        :selectedTopicID="newSpaceTopicID"
        :deleteDialog="deleteDialog"
        :selectedSpaceId="selectedSpaceId"
        :deleteTarget="deleteTarget"
        @update:new-space-dialog="newSpaceDialog = $event"
        @update:delete-space-dialog="deleteDialog = $event"
        @new-space-name="createSpace"
        @confirm-delete="confirmDelete"
      />
    </div>
    <DraggableTopicList />
  </v-container>
</template>

<script>
import SpaceMan from '@/views/SpaceMan.vue'
import SyntopixEditor from '@/views/SyntopixEditor.vue'

import Dialogs from '@/views/Dialogs.vue'
import localStorageService from '@/services/localStorageService.js'
import { Audit, isEmpty } from '@/js/helpers.js'
import DraggableTopicList from '../components/DraggableTopicList.vue'

export default {
  name: 'Syntopix.vue',
  components: { Dialogs, SpaceMan, SyntopixEditor, DraggableTopicList },

  computed: {
    hasTopics() {
      return this.localTabTopics.length > 0
    },
    client() {
      return this.$socket ? this.$socket.client : null
    },
    spaceGroup() {
      return {
        name: 'topics',
        pull: this.isClone ? true : 'clone',
        put: true,
      }
    },
  },

  data() {
    return {
      // editThisTopic: null,
      test: null,
      // custom version of socket from io.extended
      openSpace: { id: '', topix: [] }, // ID of the currently open Space

      spaces: [],
      isClone: false,
      tabs: ['Favorites', 'Private', 'Topics'],
      activeTab: 0,
      localTabTopics: [],
      localSpaceTopics: [],
      // selectedTopic: null,
      selectedTopicID: '',
      selectedSpace: null,

      // sidebarVisible: true,
      // sidebarWidth: 250,
      qrDialogVisible: false,
      qrTopic: null,
      maxSize: 300,
      isDuplicateDrop: false,

      // newSpaceDialog: false, // Controls space name dialog
      // newSpaceTopicID: null, // Stores the topic being added to a new space
      // deleteDialog: false, // Controls delete confirmation dialog
      // selectedSpaceId: null, // Space to delete
      // deleteTarget: null,
      deleteType: '',
    }
  },

  methods: {
    editTopic(topic) {
      console.log('topic :>> ', { ...topic })
      this.client.emit('edit_topic', topic, (response) => {
        this.editThisTopic = response
      })
    },

    openSpaceDialog(topicId) {
      this.newSpaceTopicID = topicId
      this.newSpaceDialog = true
    },
    openDeleteDialog({ type, target }) {
      this.deleteType = type
      this.deleteTarget = target
      this.deleteDialog = true // Triggers Dialogs.vue
    },

    confirmDelete() {
      this.deleteObject(this.deleteType, this.deleteTarget)
      this.deleteDialog = false // Close dialog
    },

    createSpace(toSpace, callback) {
      this.newSpaceDialog = false

      // Ensure space is created first
      this.client.emit('create_space', toSpace, (response) => {
        if (response.success) {
          // ✅ Now link the new space to the topic
          this.addSpaceToTopic({ topicId: this.newSpaceTopicID, newSpaceId: toSpace }, callback)
        } else {
          console.warn('❌ Space creation failed:', response)
        }
      })
    },

    // createSpace(spaceName) {
    //   if (!spaceName) {
    //     console.warn('❌ Space creation canceled.');
    //     return;
    //   }

    //   const newSpace = {
    //     id: Date.now().toString(),
    //     name: spaceName,
    //     topics: [{ id: this.newSpaceTopicID }],
    //   };

    //   this.spaces.unshift(newSpace);
    //   this.newSpaceDialog = false;

    //   // Persist new space to Redis
    //   this.$emit('add-space-to-topic', {
    //     topicId: this.newSpaceTopicID,
    //     newSpaceId: newSpace.id,
    //   });
    // },

    addSpaceToTopic({ topicId, newSpaceId }, callback) {
      console.warn('topicId, newSpaceId :>> ', topicId, newSpaceId)
      this.client.emit('add_space_to_topic', { topicId, newSpaceId }, (response) => {
        if (callback) {
          callback(response)
        }
      })
    },
    removeSpaceFromTopic({ topicId, fromSpace }, callback) {
      this.client.emit('remove_space_from_topic', { topicId, fromSpace }, (response) => {
        if (callback) {
          callback(response)
        }
      })
    },

    onAddTopicToSpace({ toSpace, id }) {
      this.client.emit('move_topic', { id, toSpace })
    },

    // can handle Topic move to different Space
    // or move Topic position in its Space
    onMoveTopic({ id, fromSpace, toSpace, isClone }, callback) {
      this.client.emit('move_topic', { id, fromSpace, toSpace, isClone }, (response) => {
        if (callback) {
          callback(response)
        }
      })
    },

    onRemoveTopicFromSpace({ id, fromSpace }) {
      Audit.add({
        intent: 'Remove Topic',
        vue: 'Syntopix',
        msg: 'Step One',
        function: 'onRemoveTopicFromSpace()',
        id,
        fromSpace,
        toSpace: null,
        action: null,
      })
      Audit.report('Remove Topic From Space')

      this.client.emit('delete_topic_from_space', { id, fromSpace })
    },
    act(intent, args, callback) {
      const label = `Syntopix.${intent}`
      console.time(label)

      const responseHandlers = {
        success: (response) => {
          Audit.add({ msg: `${intent} Successful` })

          if (response.toSpace) {
            Audit.add({ msg: `Expanding Space ${response.toSpace}` })
            this.$emit('open-space', response.toSpace)
          }
        },
        error: (response) => {
          Audit.add({
            msg: `!! ERROR in ${intent}`,
            error: response.error,
          })
        },
        default: () => {
          Audit.add({ msg: `****** Unhandled response type in ${intent}` })
        },
      }

      const respond = (response) => {
        console.log(`respond() called with intent: ${intent}, response:`, response)

        const handler =
          responseHandlers[response.success ? 'success' : 'error'] || responseHandlers.default
        handler(response)

        Audit.report(label)
        console.timeEnd(label)

        if (callback) {
          callback(response)
        }
      }

      // Emit event with proper naming
      // const eventName = intent.replace('-', '_'); // Ensures consistent naming for Socket events
      this.client.emit('move', { ...args }, respond)
    },

    handleIntent(args) {
      const { id, fromSpace, toSpace, isClone, type } = args
      const isReorder = fromSpace && toSpace && fromSpace === toSpace
      const isRemove = fromSpace && !toSpace
      const isAdd = !fromSpace && toSpace
      const isMove = fromSpace && toSpace && fromSpace !== toSpace

      const action = isClone
        ? 'clone'
        : isReorder
        ? 'reorder'
        : isRemove
        ? 'remove'
        : isAdd
        ? 'add'
        : isMove
        ? 'move'
        : 'NOOP'

      Audit.add({
        msg: `Syntopix.handleIntent()`,
        intent: 'move',
        id,
        fromSpace,
        toSpace,
        action,
        type,
      })
      Audit.report()

      this.act('move', { ...args })
    },

    //#endregion Topic Move, Clone, Delete, Add
    reorderTopicCards({ newTopicOrder }) {
      this.client.emit('persist_topic_order', { newTopicOrder }, (response) => {
        if (response.success) {
          console.log(`Topic order persisted successfully.`)
        } else {
          console.error(`Failed to persist topic order:`, response.error)
        }
      })
    },

    // handled by topicController
    saveTopicOrder({ spaceId, newOrder }) {
      this.client.emit('save_topic_order', { spaceId, newOrder }, (response) => {
        if (response.success) {
          console.log(`Topic order for space ${spaceId} persisted successfully.`)
        } else {
          console.error(`Failed to persist topic order:`, response.error)
        }
      })
    },

    reorderSpaces({ newIndex, oldIndex }) {
      console.warn(`[Syntopix] Reordering Spaces from ${oldIndex} to ${newIndex}`)

      if (typeof newIndex !== 'number' || typeof oldIndex !== 'number') {
        console.error('[Syntopix] Invalid indexes received', {
          newIndex,
          oldIndex,
        })
        return
      }

      // 🔥 1. Update `spaces` to reflect the new order
      const reorderedSpaces = [...(this.spaces || [])] // Use `spaces`, not `localSpaces`

      if (!reorderedSpaces[oldIndex]) {
        console.error('[Syntopix] Invalid oldIndex:', oldIndex)
        return
      }

      const [movedSpace] = reorderedSpaces.splice(oldIndex, 1) // Remove from old position
      reorderedSpaces.splice(newIndex, 0, movedSpace) // Insert at new position

      this.spaces = reorderedSpaces // ✅ Vue detects the change

      // 🔥 2. Emit the reordered list of Space IDs to the backend
      const orderedIDs = reorderedSpaces.map((space) => space.id)

      this.client.emit('reorder_spaces', { orderedIDs }, (response) => {
        if (response.success) {
          console.log('[Syntopix] Space order saved successfully')
        } else {
          console.error('[Syntopix] Failed to save space order:', response.error)
        }
      })
    },

    setOpenSpace(space) {
      this.openSpace = space // Update the open Space
      if (space.id) {
        this.fetchTopicsForSpace(space) // Fetch topics for the selected Space
      } else {
        console.log('No Space is open.')
      }
    },
    onDeleteTopicFromSpace({ id, fromSpace }) {
      console.time('Syntopix.onDeleteTopicFromSpace in')

      Audit.add({
        intent: `Handle Sidabar request to delete topic ${id} from space ${fromSpace}`,
        vue: 'Syntopix',
        msg: 'what is the message of no message?',
        function: 'onDeleteTopicFromSpace()',
        id,
        fromSpace,
      })
      Audit.report('Syntopix.deleteTopicFromSpace()')
      console.warn(`audit:  Deleting topic ${id} from space ${fromSpace}`)
      this.client.emit('delete_topic_from_space', { id, fromSpace }, (response) => {
        // check value returned by redis delete
        if (response && response.success) {
          console.warn(`audit:  Successfully deleted topic ${id} from space ${fromSpace}`)
          this.fetchSpaces() // Refresh spaces
        } else {
          console.error(`Failed to delete topic from space: ${response?.error}`)
        }
      })
      console.timeEnd('onDeleteTopicFromSpace in')
    },

    updateSpaces() {
      this.spaces.push({ id: Date.now(), topics: [] })
      this.newSpaceDialog = false
    },

    deleteSpaceFromTopics(space) {
      console.log(`Requesting deletion of space: ${space}`)
      this.client.emit('delete_space_from_topics', { space }, (response) => {
        if (response.success) {
          console.log('Space deleted successfully.')
          this.fetchSpaces() // Refresh spaces
        } else {
          console.error('Failed to delete space:', response.error)
        }
      })
    },

    selectSpace(space) {
      this.openSpace = space
    },

    setActiveTab(tabIndex) {
      this.activeTab = tabIndex
    },

    selectTopic(topic) {
      this.selectedTopic = topic
      console.log('Selected topic in Syntopix:', topic)
      this.fetchTopicDetails(topic.id) // Optional: Fetch full topic details if needed
    },

    fetchTopicDetails(id) {
      this.client.emit('fetch_topic_details', { id }, (response) => {
        if (response.success) {
          console.log('Fetched topic details:', response.details)
          this.selectedTopic = response.details // Update with fetched details
        } else {
          console.error('Failed to fetch topic details:', response.error)
        }
      })
    },

    // TODO replicate this reordering for Spaces, too.
    updateTopicOrder(updatedTopics) {
      // TODO update redis with new order for Topics
      this.localTabTopics = updatedTopics
    },

    closeQrDialog() {
      this.qrDialogVisible = false
    },

    //#endregion
    saveTopicContent(topic) {
      console.log('saving topic :>> ', { ...topic })
      this.client.emit('save_topic_content', topic, (response) => {
        if (response.error) {
          console.error('Failed to save topic content:', response.error)
        } else {
          console.log('save topic content', response.topics)
          // this.fetchTopics();
        }
      })
    },

    addTopic(newTopic) {
      console.log('newTopic :>> ', newTopic)
      // Topic already is an object, so don't wrap it in another object
      this.client.emit('add_topic', newTopic, (response) => {
        if (response.error) {
          console.error('Failed to fetch topics:', response.error)
        } else {
          console.log('Fetched topics:', response.topics)
          this.fetchTopics()
        }
      })
    },
    deleteSpace(space) {
      this.deleteObject('space', space.id)
    },

    deleteObject(type, target) {
      const eventName = type === 'topic' ? 'delete_topic' : 'delete_space'
      const { id } = target
      this.client.emit(eventName, { id }, (response) => {
        if (response.success) {
          if (type === 'space') {
            this.fetchSpaces()
          } else {
            this.localTabTopics = this.localTabTopics.filter((t) => t.id !== id)
          }
        }
      })
    },
    // deleteTopic(topic) {
    //   console.log('topic :>> ', topic);
    //   // Topic already is an object, so don't wrap it in another object
    //   this.client.emit('delete_topic', { id: topic.id }, (response) => {
    //     if (response.error) {
    //       console.error('Failed to delete Topic:', response.error);
    //     } else {
    //       console.log('Deleted Topic:', response);
    //       // this.fetchTopics();
    //       this.fetchSpaces();
    //     }
    //   });
    // },

    fetchSpaces() {
      this.client.emit('fetch_spaces', null, (response) => {
        this.spaces = response.spaces || []
      })
    },
    fetchTopicsForSpace(space) {
      const spaceId = space.id
      this.client.emit('fetch_space_topics', { space }, (response) => {
        if (response.success) {
          const space = this.spaces.find((s) => s.id === spaceId)
          if (space) {
            // Ensure reactive update
            this.$set(space, 'topiqx', response.topics || [])
            console.log(`Updated topics for space ${spaceId}:`, space.topiqx)
          } else {
            console.warn(`Space with ID ${spaceId} not found.`)
          }
        } else {
          console.error(`Failed to fetch topics for space ${spaceId}:`, response.error)
        }
      })
    },

    fetchTopics() {
      this.client.emit('fetch_topics', {}, (response) => {
        const { error, topics } = response
        if (error) {
          console.error('Failed to fetch topics:', error)
        } else {
          console.log('Fetched topics:', topics.length)
          this.localTabTopics = topics
        }
      })
    },
  },

  sockets: {
    topics_update(payload) {
      if (isEmpty(payload)) {
        console.warn('topics_update fired with no new Topics')
        return
      }
      if (Array.isArray(payload)) {
        console.log(`topics event received: ${payload.length} spaces`)
        this.localTabTopics = payload // ✅ Ensure spaces update in the UI
      } else {
        this.localTabTopics.push(payload)
      }
    },

    handshake({ socketID, pk }) {
      console.log(socketID, 'pk :>> ', pk)
    },
    newUser(pk) {
      debugger
      console.log('pk :>> ', pk)
      console.log('New PK received:', pk)
      localStorageService.set('pk', pk)
    },
    testing(data) {
      console.log('Testing event received:', data)
    },
    connect() {
      console.log('Syntopix socket connected with ID:', this.client.id)
    },
  },

  watch: {
    // client: {
    //   handler(client, old) {
    //     console.log('client.connected',client.connected, 'from', old.connected);
    //   },
    //   deep: true, // ✅ Watches for changes inside objects (topics moving, renaming, etc.)
    // },
  },

  created() {
    this.fetchTopics()
    this.fetchSpaces()
  },

  mounted() {
    this.test = this.$route.params.id || this.$route.query.id
    console.log('Syntopix.vue socket ID:', this.client.id, '\n')
  },
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh; /* Ensure full-height layout */
}

Sidebar {
  width: 250px;
  background-color: #f4f4f4;
  border-right: 1px solid #ddd;
  box-sizing: border-box; /* Include padding in width */
}

MainContent {
  flex: 1;
  padding: 1em;
  overflow-y: auto; /* Handle overflow for large content */
  box-sizing: border-box;
}
.dragging {
  cursor: no-drop;
}

.drop-zone {
  cursor: pointer;
}

.dragging.over-drop-zone {
  cursor: grab;
}
</style>

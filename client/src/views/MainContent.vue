<template>
  <div class="layout">
    <!-- Main Content -->
    <main>
      <!-- Tabs -->
      <header class="tabs-container">
        <nav>
          <button
            v-for="(tab, index) in tabs"
            :key="tab"
            :class="{ active: activeTab === index }"
            @click="setActiveTab(index)"
          >
            {{ tab }}
          </button>
        </nav>
      </header>

      <!-- Topics Content -->
      <section>
        <h2>{{ tabs[activeTab] }} Tab</h2>
        <VueDraggable
          :list="localTopics"
          :group="{ name: 'topics', pull: 'clone', put: true }"
          @end="onReorder"
        >
          <v-card
            v-for="topic in localTopics"
            :key="topic.id"
            class="topic-card"
            draggable="true"
            @dragstart="onDragStart($event, topic)"
            @click="selectTopic(topic)"
          >
            <v-card-title>{{ topic.title }}</v-card-title>
            <v-card-text
              >{{ topic.summary || 'No summary' }}
              <br />
              ID: {{ topic.id }}</v-card-text
            >
            <v-card-actions>
              <v-btn small text @click="loadEditor(topic)"> Edit </v-btn>
              <v-spacer />
              <v-btn small text @click="deleteTopic(topic)"> Delete </v-btn>
            </v-card-actions>
          </v-card>
        </VueDraggable>

        <!-- Add Topic Component -->
        <add-topic @submit="validateAndAddTopic" />
      </section>
    </main>
  </div>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'
import AddTopic from './AddTopic.vue'
import { Audit, pj } from '@/js/helpers.js'

export default {
  components: { VueDraggable, AddTopic },
  props: {
    tabs: {
      type: Array,
      required: true,
    },
    activeTab: {
      type: Number,
      required: true,
    },
    localTabTopics: {
      type: Array,
      required: true,
    },
    selectedTopic: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      localTopics: [],
    }
  },
  watch: {
    localTabTopics(localTabTopics) {
      if (!localTabTopics) {
        console.warn('No topics')
        return
      }
      console.log('localTabTopics :>> ', localTabTopics)
      this.localTopics = localTabTopics
    },
  },
  methods: {
    loadEditor(topic) {
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

    onDragStart(event, topic) {
      Audit.add({ msg: `Dragging new Topic: ${pj(topic)}` }) // Debugging
      topic.intent = 'add'
      event.dataTransfer.setData('topic', JSON.stringify(topic))
    },

    setActiveTab(index) {
      this.$emit('set-active-tab', index)
    },
    updateOrder() {
      this.$emit('update-order', this.localTopics)
    },

    onReorder() {
      // const { oldIndex, newIndex } = event;
      // const topic = this.localTopics[newIndex];
      // console.log(
      //   `Reordered topic: ${topic.title} from ${oldIndex} to ${newIndex}`
      // );
      this.$emit('update-order', this.localTopics)
    },

    selectTopic(topic) {
      this.$emit('select-topic', topic)
    },
    editTopic(topic) {
      this.$emit('edit-topic', topic)
    },
    deleteTopic(topic) {
      this.$emit('delete-topic', topic)
    },
    validateAndAddTopic(topic) {
      this.$emit('add-topic', topic)
    },
  },
}
</script>

<style scoped>
.layout {
  display: flex;
}

main {
  flex: 1;
  padding: 1em;
}
.tabs-container nav {
  display: flex;
  gap: 1em;
  margin-bottom: 1em;
}
.tabs-container nav button {
  padding: 0.5em 1em;
  border: none;
  background: #f4f4f4;
  cursor: pointer;
}
.tabs-container nav button.active {
  background: #ccc;
  font-weight: bold;
}
.topic-card {
  background: #fff;
  border: 3px solid #ddd;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: 4px;
  cursor: pointer;
}
</style>

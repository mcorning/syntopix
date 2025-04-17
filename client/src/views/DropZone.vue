<template>
  <VueDraggable
    v-model="dropTopics"
    :group="{ name: 'topics', pull: true, put: () => false }"
    @end="handleDrop"
  >
    <v-card v-for="topic in dropTopics" :key="topic.id" class="topic-card pa-3">
      <span>{{ topic.name }}</span>
    </v-card>
  </VueDraggable>
</template>

<script>
import { Audit, safeParseJSON } from '@/js/helpers.js'
import { VueDraggable } from 'vue-draggable-plus'

export default {
  name: 'DropZone.vue',
  components: { VueDraggable },
  data() {
    return {
      dropTopics: [], // VueDraggable requires v-model, even if unused
      dropZoneIcon: 'mdi-question',
      dropZoneText: `Add Topic from right. Delete Topic or Space from bottom.`,
    }
  },
  methods: {
    handleDrop(event) {
      const rawTopicData = event.originalEvent?.dataTransfer.getData('topic')
      const topicData = safeParseJSON(rawTopicData)
      const rawSpaceData = event.originalEvent?.dataTransfer.getData('space')
      const spaceData = safeParseJSON(rawSpaceData)

      Audit.add({
        file: 'DropZone',
        fnc: `handleDrop:`,
        ...spaceData,
        ...topicData,
      })
      Audit.report('handleDrop step')

      // handled by Sidebar's detectDragType()
      this.$emit('drop', { spaceData, topicData })
    },
  },
}
</script>

<style scoped>
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

<template>
  <v-card class="pa-4">
    <v-card-title>Reorder Topics</v-card-title>
    <v-card-text>
      <VueDraggable v-model="topics" item-key="id" class="drag-container">
        <template #item="{ element }">
          <v-sheet elevation="1" class="pa-2 mb-2">
            {{ element.title }}
          </v-sheet>
        </template>
      </VueDraggable>
    </v-card-text>
  </v-card>
</template>

<script>
import { VueDraggable } from 'vue-draggable-plus'

export default {
  components: { VueDraggable },
  data() {
    return {
      topics: [
        { id: 1, title: 'First Topic' },
        { id: 2, title: 'Second Topic' },
        { id: 3, title: 'Third Topic' },
      ],
    }
  },
}
</script>

<style scoped>
.drag-container {
  min-height: 200px;
}
</style>

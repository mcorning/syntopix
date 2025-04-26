<template>
  <v-card class="spaces" flat>
    <div class="d-flex justify-between align-center mb-2">
      <h3 class="text-h6 font-weight-bold">Spaces</h3>
      <!-- Placeholder for future "Add Space" button -->
    </div>
    <v-divider class="mb-2"></v-divider>
    <p v-if="spaces.length === 0" class="text-caption text-grey">No spaces yet.</p>

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

    <VueDraggable
      v-model="localSpaces"
      item-key="id"
      class="pa-2"
      tag="v-list"
      @end="onReorderSpaces"
    >
      <v-list-item
        v-for="space in localSpaces"
        :key="space.id"
        :active="space.id === selectedSpace?.id"
        class="space-item pa-2"
        @click="selectSpace(space)"
      >
        <v-list-item-title class="text-body-2">{{ space.name }}</v-list-item-title>
      </v-list-item>
    </VueDraggable>
  </v-card>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
// Mock spaces for testing drag-and-drop
const props = defineProps({
  spaces: {
    type: Array,
    default: () => [],
  },
  selectedSpace: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['select-space', 'reorder-spaces', 'open-space-dialog'])
const zone = ref([])

const dropZoneDragOptions = {
  group: {
    name: 'topics',
    pull: 'clone',
    put: true,
  }
}

// @add on zone dragging from Topics
// NOOP on deleting topic from space card
function promptForSpace(evt) {
  evt.preventDefault()
  const topic = evt.data
  if (!topic) {
    console.warn('⚠️ Invalid drop detected.')
    return
  }

  // Emit event to open the space creation dialog in `Syntopix.vue`
  emit('open-space-dialog', topic.id)
}

function selectSpace(space) {
  emit('select-space', space)
}

const localSpaces = ref([])

watch(
  () => props.spaces,
  (newVal) => {
    localSpaces.value = Array.isArray(newVal) ? [...newVal] : []
  },
  { immediate: true }
)

function onReorderSpaces() {
  emit('reorder-spaces', localSpaces.value)
}
</script>

<style scoped>
.v-card.spaces {
  width: 100%;
}
.spaces {
  background: #f3f4f6;
  padding: 20px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.space-item.pa-2 {
  background: white;
  padding: 10px;
  border: 1px solid #ccc;
  transition: border 0.2s ease-in-out;
  border-radius: 6px;
  cursor: pointer;
}

.space-item.drop-hover {
  border: 2px dashed #ff9800;
  background-color: rgba(255, 152, 0, 0.1);
}

.space-chip {
  background: #3bdeff;
  color: #000;
  font-weight: bold;
  border-radius: 9999px;
  padding: 2px 8px;
  font-size: 0.75rem;
}

.drop-zone {
  padding: 20px;
  border: 2px dashed #007bff;
  background: #dbeafe;
  text-align: center;
  margin-bottom: 10px;
  border-radius: 8px;
}
</style>

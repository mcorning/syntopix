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
        @update-selected-topic="updateSelectedTopic"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import SpaceMan from '@/components/SpaceMan.vue'

const spaces = ref([])
const localSpaceTopics = ref({})
const selectedSpace = ref(null)
const selectedTopic = ref(null)
const sidebarVisible = ref(true)
const sidebarWidth = ref(300)
const openSpace = ref(null)
const localTabTopics = ref([])
const test = ref(false)

const hasTopics = computed(() => {
  return Object.keys(localSpaceTopics.value).length > 0
})

function addTopic() {}
function setOpenSpace() {}
function fetchTopicsForSpace() {}
function handleIntent() {}
function deleteSpace() {}
function selectSpace() {}
function onDeleteTopicFromSpace() {}
function reorderSpaces() {}
function saveTopicOrder() {}
function updateSpaces() {}
function createSpace() {}
function addSpaceToTopic() {}
function removeSpaceFromTopic() {}
function updateSelectedTopic() {}
</script>

<style scoped>
.layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

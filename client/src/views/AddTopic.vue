<template>
  <v-card class="new-topic-card" width="400">
    <v-card-title>New Topic</v-card-title>
    <v-card-text>
      <v-text-field v-model="title" label="Topic Title" autofocus @keyup.enter="addTopic" />
      <v-text-field v-model="summary" placeholder="Enter a Topic summary" @keyup.enter="addTopic" />
      <v-checkbox v-model="isPrivate" label="Private Topic" />
    </v-card-text>
    <v-card-actions>
      <v-btn :disabled="!title" @click="addTopic">Add Topic</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      title: 'T1',
      summary: 'nothing yet',
      isPrivate: false,
    }
  },
  methods: {
    addTopic() {
      if (this.title.trim()) {
        const topic = {
          title: this.title.trim(),
          summary: this.summary.trim(),
          isPrivate: this.isPrivate ? '1' : '0',
        }
        this.$emit('submit', topic)
        this.title = '' // Clear inputs
        this.summary = ''
        this.isPrivate = false
      }
    },
  },
  mounted() {
    console.log('here')
  },
}
</script>

<style scoped>
.new-topic-card {
  background-color: #bfd8f1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
  padding: 30px;
  border: 2px dashed #1976d2;
  border-radius: 10px;
  transition: background-color 0.3s ease, transform 0.3s ease;
  cursor: pointer;
}
.new-topic-card:hover {
  background-color: #e3f2fd;
  transform: scale(1.05);
}
</style>

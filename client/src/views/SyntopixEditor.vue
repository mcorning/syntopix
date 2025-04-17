<template>
  <v-dialog v-model="dialog" fullscreen hide-overlay>
    <v-card>
      <v-toolbar dense dark color="primary">
        <v-btn icon dark @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Edit Topic</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn text @click="save">Save</v-btn>
      </v-toolbar>

      <v-card-text>
        <v-container fluid>
          <v-text-field v-model="editableTitle" label="Title" outlined />
          <v-textarea v-model="editableSummary" label="Summary" auto-grow rows="4" outlined />
          <v-textarea v-model="editableContent" label="Content" auto-grow rows="12" outlined />
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: ['topic'],
  data() {
    return {
      dialog: false,
      editableTitle: '',
      editableSummary: '',
      editableContent: '',
    }
  },
  watch: {
    dialog(val) {
      if (!val) this.$emit('close')
    },
    topic: {
      immediate: true,
      handler(val) {
        if (val) {
          this.editableTitle = val.title || ''
          this.editableSummary = val.summary || ''
          this.editableContent = val.content || ''
          this.dialog = true
        }
      },
    },
  },
  methods: {
    save() {
      this.$emit('save', {
        id: this.topic.id,
        title: this.editableTitle,
        summary: this.editableSummary,
        content: this.editableContent,
      })
      this.dialog = false
    },

    close() {
      this.dialog = false
    },
  },
}
</script>

<style scoped>
.v-card-text {
  padding-top: 0;
}
</style>

<template>
  <div>
    <v-snackbar
      v-model="showToast"
      :timeout="options.timeout"
      :top="options.other.top"
      :bottom="options.bottom"
      :color="options.other.color"
      multi-line
      vertical
    >
      <v-card-text v-html="options.text"></v-card-text>

      <template v-slot:action="{ on, attrs }">
        <v-btn v-on="on" v-bind="attrs" text color="white" @click="done" v-text="options.button">
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
export default {
  name: 'ToastVue',
  props: {
    options: {
      type: Object,
      default: () => {
        return {
          text: 'Task complete',
          button: 'Ok',
          timeout: 10000,
          showToast: false,
          color: 'accent',
          other: {
            type: Object,
            default: () => {
              return { top: false }
            },
          },
        }
      },
    },
  },
  data() {
    return {
      showToast: false,
    }
  },
  methods: {
    done() {
      this.showToast = false
      if (this.options.fnc) {
        this.options.fnc()
      }
    },
  },
  mounted() {
    this.showToast = this.options.showToast
    if (!this.$props.color) {
      this.color = 'red'
    }
  },
}
</script>

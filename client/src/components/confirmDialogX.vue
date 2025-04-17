<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    :fullscreen="options.fullscreen"
    persistent
    @keydown.esc="cancel"
    @keydown.enter="agree"
  >
    <v-card>
      <v-toolbar dark :color="options.color" dense flat>
        <v-toolbar-title
          class="text-body-1 font-weight-bold"
          :style="{ color: options.titleColor }"
        >
          {{ title }}
        </v-toolbar-title>
      </v-toolbar>

      <v-banner v-if="bannerUrl" single-line @click:icon="alert">
        <v-img :src="bannerUrl"></v-img>
        <template v-if="moreInfo" v-slot:actions>
          <v-btn color="primary" text :href="bannerUrl"> More info </v-btn>
        </template>
      </v-banner>
      <v-card-text v-show="!!message" class="pa-4 black--text" v-html="message"></v-card-text>
      <v-card-text v-show="!!prompt" class="pa-4 black--text">
        <slot />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer v-if="!showAgreeButton" />

        <v-btn v-if="showConfirm" text class="body-2 font-weight-bold" @click.native="cancel">
          Cancel</v-btn
        >
        <v-spacer></v-spacer>

        <v-btn
          v-if="showAgreeButton"
          color="accent"
          class="body-2 font-weight-bold"
          @click.native="agree"
          >OK</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmDlg',
  props: {
    validate: {
      type: Function,
    },
  },
  computed: {
    showConfirm() {
      return !this.options.noconfirm
    },
    showAgreeButton() {
      return this.options.showAgreeButton
    },
  },
  data() {
    return {
      showPreview: false,
      moreInfo: false,
      dialog: false,
      resolve: null,
      reject: null,
      message: null,
      prompt: null,
      val: '',
      title: null,
      bannerUrl: '',
      options: {
        color: 'primary',
        titleColor: 'white',
        width: 200,
        zIndex: 200,
        noconfirm: true,
        showAgreeButton: true,
        fullscreen: false,
      },
    }
  },

  methods: {
    open({ title, bannerUrl, message, prompt, defaultVal, options }) {
      console.log(options)
      console.log(' ')
      this.dialog = true
      this.title = title
      this.bannerUrl = bannerUrl
      this.message = message
      this.prompt = prompt
      this.val = defaultVal
      this.options = { ...this.options, ...options }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },

    close() {
      this.dialog = false
    },

    agree() {
      if (this.validate) {
        if (!this.validate()) {
          return
        }
      }
      this.resolve(true)
      this.dialog = this.showAgreeButton ? false : true
    },

    cancel() {
      this.resolve(null)
      this.dialog = false
    },
  },
  watch: {},
  mounted() {},
}
</script>

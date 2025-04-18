<template>
  <div>
    <!-- New Space Dialog -->
    <v-dialog v-model="localNewSpaceDialog" max-width="500px">
      <v-card>
        <v-card-title>
          <span>Create New Space for {{ selectedTopicID }}</span>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="toSpace"
            label="Enter Space Name"
            autofocus
            @keydown.enter.prevent="createSpace"
          />
        </v-card-text>
        <v-card-actions>
          <v-btn text color="primary" @click="createSpace">Create</v-btn>
          <v-btn text @click="localDeleteDialog = false">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete dialog -->
    <v-dialog v-model="localDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>Are you sure you want to delete this {{ id }}?</v-card-text>
        <v-card-actions>
          <v-btn text @click="cancelDelete">Cancel</v-btn>
          <v-btn color="red" text @click="confirmDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- QR Code Dialog -->
    <v-dialog v-model="localQrDialogVisible" max-width="500">
      <v-card ref="cardview">
        <v-card-title class="text-h5">
          Link {{ selectedTopicID }} to {{ qrTopic?.title }}
        </v-card-title>
        <v-fab-transition>
          <v-btn @click="closeQrDialog" class="mt-7" plain absolute top right fab small>
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-fab-transition>
        <v-card-text>
          <div class="d-flex justify-center">
            <VueQRCodeComponent
              id="qr"
              ref="qr"
              :text="getTopicQrCode()"
              error-level="L"
              :size="maxSize * 0.8"
            />
          </div>
          <span>{{ getTopicQrCode() }}</span>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" text @click="copyQrLink">Copy Link</v-btn>
          <v-btn color="primary" text @click="saveQrImage">Save QR Code</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import VueQRCodeComponent from 'vue-qr-generator'
import { Audit, deriveResponseType } from '@/js/helpers.js'

export default {
  name: 'Dialogs.vue',
  components: { VueQRCodeComponent },
  // TODO upgrade props to Policy
  props: [
    'defaultSpaceName',
    'selectedTopicID',
    'selectedSpaceId',
    'newSpaceDialog',
    'deleteDialog',
    'deleteTarget',
    'qrDialogVisible',
    'qrTopic',
    'maxSize',
  ],
  computed: {
    id() {
      if (!this.deleteTarget) {
        return ''
      }
      return this.deleteType == 'topic' ? this.deleteTarget.title : this.deleteTarget.id
    },
  },
  data() {
    return {
      toSpace: '',
      localNewSpaceDialog: this.newSpaceDialog, // Copy prop to local data
      localQrDialogVisible: this.qrDialogVisible,
      localDeleteDialog: false,
    }
  },

  methods: {
    // closeNewSpaceDialog() {
    //   this.$emit('close-new-space-dialog');
    // },
    // closeDeleteSpaceDialog() {
    //   this.$emit('close-delete-space-dialog');
    // },

    createSpace() {
      this.$emit('new-space-name', this.toSpace)
    },

    createSpaceForTopic() {
      const responseHandlers = {
        success: (response) => {
          Audit.add({ msg: `createSpace successful ${response.success}` })
          // Add any success logic here
        },
        prompt: (response) => {
          Audit.add({ msg: `User prompt required: ${response.prompt}` })
        },
        error: (response) => {
          Audit.add({ msg: `!!! ${response.error} ERROR in createSpace()` })
        },
        default: () => {
          console.warn('Unhandled response type')
        },
      }

      const respond = (response) => {
        console.log(`respond() called with`, response)

        const type = response.type || deriveResponseType(response) // Ensure type is derived
        const handler = responseHandlers[type] || responseHandlers.default

        handler(response)
        Audit.report('Audit: Dialog.vue ')
      }

      const id = this.selectedTopicID
      const toSpace = this.toSpace

      Audit.add({
        intent: 'Create a Space',
        vue: 'Dialog',
        msg: 'Step One',
        function: 'createSpace()',
        id,
        fromSpace: null,
        toSpace,
        isClone: false,
      })

      this.$emit(
        'move',
        {
          toSpace,
          id,
        },
        respond
      )
    },

    confirmDelete() {
      this.$emit('confirm-delete') // Notify Sidebar to delete
      this.localDeleteDialog = false // Close dialog
    },
    cancelDelete() {
      this.$emit('cancel-delete') // ❌ Reject Promise
    },

    closeQrDialog() {
      this.$emit('close-qr-dialog')
    },
    getTopicQrCode() {
      return this.qrTopic ? `https://example.com/topics/${this.qrTopic.id}` : ''
    },
    copyQrLink() {
      const qrCodeText = this.getTopicQrCode()
      if (!qrCodeText) {
        this.$toast.error('No QR code link available to copy.')
        return
      }
      navigator.clipboard
        .writeText(qrCodeText)
        .then(() => {
          this.$toast.success('Link copied to clipboard!')
        })
        .catch((err) => {
          console.error('Failed to copy link:', err)
          this.$toast.error('Failed to copy link to clipboard.')
        })
    },
    saveQrImage() {
      const qrElement = this.$refs.qr.$el // Reference to the QR Code component's element
      if (!qrElement) {
        console.error('QR Code element is not available.')
        return
      }

      const svgData = new XMLSerializer().serializeToString(qrElement) // Serialize the SVG
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      const svgBlob = new Blob([svgData], {
        type: 'image/svg+xml;charset=utf-8',
      })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL('image/png')

        // Trigger download
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = `${this.qrTopic.title || 'qr-code'}.png`
        a.click()

        URL.revokeObjectURL(url) // Clean up
      }
      img.src = url
    },
  },
  watch: {
    deleteTarget(deleteTarget) {
      console.log('deleteTarget :>> ', { ...deleteTarget })
      console.log()
    },

    deleteDialog(deleteDialog) {
      this.localDeleteDialog = !!deleteDialog
    },

    data(selectedTopicID) {
      this.toSpace = selectedTopicID
    },
    newSpaceDialog(newVal) {
      this.localNewSpaceDialog = newVal // Sync when parent updates
    },
    localNewSpaceDialog(newVal) {
      this.$emit('update:new-space-dialog', newVal) // Emit change to parent
    },
    deleteSpaceDialog(newVal) {
      this.localDeleteSpaceDialog = newVal // Sync when parent updates
    },
    localDeleteSpaceDialog(newVal) {
      this.$emit('update:delete-space-dialog', newVal) // Emit change to parent
    },
    qrDialogVisible(newVal) {
      this.localQrDialogVisible = newVal // Sync when parent updates
    },
    localQrDialogVisible(newVal) {
      this.$emit('update:qr-dialog-visible', newVal) // Emit change to parent
    },
  },
  created() {
    this.toSpace = this.defaultSpaceName
  },
  mounted() {},
}
</script>

<style scoped>
.text-h5 {
  font-size: 1.5rem;
}
</style>

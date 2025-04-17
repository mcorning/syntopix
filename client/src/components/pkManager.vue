<template>
  <div>
    <v-btn x-small color="accent" @click="managePk(true)" :style="{ color: barTextColor }">
      Manage {{ shortenedPk }}
    </v-btn>

    <confirm-dialog ref="managePks">
      <v-form ref="form" v-model="isValid">
        <v-text-field
          v-model="addThisPk"
          label="Enter another PK here"
          persistent-hint
        ></v-text-field>
      </v-form>
    </confirm-dialog>

    <confirm-dialog ref="managePin">
      <v-card flat max-width="400" class="mx-auto my-2 text-center">
        <div class="d-flex flex-column justify-space-between align-center">
          <v-img
            src="https://ik.imagekit.io/tqrtoken/Logo/Logo2_1.png"
            height="100"
            width="100"
          ></v-img>
        </div>
        <v-form ref="form" v-model="isValid">
          <v-text-field
            v-model="securedPin"
            type="number"
            :rules="[rules.pin]"
            label="Security PIN"
            hint="to manage your PK"
            persistent-hint
            counter
            maxlength="6"
          ></v-text-field>
        </v-form>
      </v-card>
    </confirm-dialog>

    <confirm-dialog ref="pkRing">
      <v-card flat max-width="400" class="mx-auto my-2 text-center">
        <v-card-title>Your Primary Key Ring</v-card-title>
        <v-card-subtitle> Manage multiple Primary Keys with this advanced dialog. </v-card-subtitle>

        <v-row align="start">
          <v-col cols="6">
            <v-btn text @click="addPk">
              <v-icon class="mt-3" color="green">mdi-key-link</v-icon>
              Create PK
            </v-btn>
          </v-col>

          <v-col cols="6">
            <v-dialog v-model="dialog" width="500">
              <v-btn text>
                <v-icon class="mt-3" color="accent">mdi-key-plus</v-icon>
                Add PK
              </v-btn>

              <v-card>
                <v-card-title class="text-h5 grey lighten-2"> Add Existing PK </v-card-title>

                <v-card-text>
                  <v-text-field v-model="extantPk" label="PK" placeholder="Paste PK here" />
                  <v-text-field
                    v-model="extantPkLabel"
                    label="Label"
                    placeholder="Paste PK label here"
                  />
                </v-card-text>

                <v-card-actions>
                  <v-btn color="primary" text @click="addPkToRing"> Add </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>

        <v-divider class="mt-5" />

        <v-list two-line subheader>
          <v-list-item-group v-model="selectedItem" active-class="accent--text">
            <v-subheader>Your Primary Keys</v-subheader>
            <v-list-item v-for="item in items" :key="item.pk">
              <v-list-item-content>
                <v-list-item-title>PK: {{ item.pk }}</v-list-item-title>
                <v-list-item-subtitle v-text="item.headline"></v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-icon color="error" @click="removePkFromRing(item)"> mdi-link-off </v-icon>
              </v-list-item-action>
            </v-list-item>
          </v-list-item-group>
        </v-list>
      </v-card>
    </confirm-dialog>
  </div>
</template>

<script>
import ConfirmDialog from '@/components/ConfirmDialog.vue'

import localStorageService from '@/services/localStorageService.js'

export default {
  name: 'PkManager',
  components: {
    ConfirmDialog,
  },
  data() {
    return {
      rules: {
        email: (value) => {
          const pattern =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return !value || pattern.test(value) || 'Invalid e-mail.'
        },
        pk0: (v) => {
          const ok = !v || /^\d{15}$/.test(v) || 'Use only 13 digits and usually ending in "-0"'
          return ok
        },
        pk: (v) => {
          const ok =
            !v ||
            /^\d{13}-d*0d*$/.test(v) ||
            'Use 13 digits followed by a hyphen "-" and a string of digits with at least one "0"'
          return ok
        },

        pin: (v) => {
          const ok = !v || /^\d{4,6}$/.test(v) || 'Use only digits (and 4 = 6 of them)'
          return ok
        },
      },
      pin: '',
      dialog: false,
      addThisPk: '',
      extantPk: '',
      extantPkLabel: '',
      securedPin: '',
      isValid: false,
      pks: JSON.parse(localStorageService.getItem('pks') || '[]'),
      selectedItem: null,
    }
  },
  computed: {
    items() {
      return this.pks.map((pk) => ({
        pk: pk.pk,
        headline: pk.label || 'No label',
      }))
    },
    barTextColor() {
      return this.$vuetify.theme.currentTheme.bartext
    },
    shortenedPk() {
      return this.cid ? `...${this.cid.slice(9)}` : ''
    },
  },
  methods: {
    addPk() {
      const newPk = { pk: Date.now().toString(), label: 'New PK' }
      this.pks.push(newPk)
      localStorageService.setItem('pks', JSON.stringify(this.pks))
    },
    addPkToRing() {
      this.dialog = false
      const newPk = { label: this.extantPkLabel, pk: this.extantPk }
      this.pks.push(newPk)
      localStorageService.setItem('pks', JSON.stringify(this.pks))
    },
    removePkFromRing(item) {
      this.pks = this.pks.filter((pk) => pk.pk !== item.pk)
      localStorageService.setItem('pks', JSON.stringify(this.pks))
    },
  },
}
</script>
<style scoped>
.text-center {
  text-align: center;
}
</style>

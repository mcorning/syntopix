<template>
  <v-app style="background-color: 'white'">
    <systemHeader isTensor="isTensor" @showHeader="handleShowHeader" />

    <!-- style keeps the footer from scolling down. now the content scrolls, instead -->
    <v-main id="main" style="overflow-y: auto">
      <!-- TODO figure out how to get errorCaptured to work in App.vue itself instead of just children -->
      <div v-if="false">
        <v-btn color="error" @click="triggerError">Trigger App Error</v-btn>
      </div>
      <keep-alive>
        <router-view
          class="mx-auto"
          :cid="cid"
          :ladybug="ladybug"
          :obx="obx"
          :navIndex="navIndex"
          :showBottomNav="showBottomNav"
          @tensorUpdated="onTensorUpdated"
          @pathChanged="onPathChanged"
          @contextChanged="contextChanged"
          @debug="onDebug"
          @statusChange="onStatusChange"
          @needFooterButtons="onNeedFooterButtons"
          @goToProfile="onGoToProfile"
          @onError="onError"
          @selectItem="selectItem"
          @mountedHome="onMountedHome"
          @activatedHome="onActivatedHome"
          @hideFooter="onHideFooter"
        >
        </router-view>
      </keep-alive>
      <v-bottom-sheet v-model="oops" inset width="500">
        <v-sheet dark class="text-center" height="200px">
          <v-btn class="mt-6" text color="red" @click="oops = !oops"> close </v-btn>
          <v-card-title>Oops...</v-card-title>
          <div>{{ oopsArray[0] }}</div>
          <div>{{ oopsArray[1] }}</div>
        </v-sheet>
      </v-bottom-sheet>
    </v-main>

    <v-footer
      app
      id="footer"
      ref="footer"
      color="primary"
      dark
      class="ma-0"
      padless
      v-if="showSystemFooter"
    >
      <!-- bottomNavigation if showBottomNav -->
      <v-row no-gutters align="center">
        <v-col v-if="showBottomNav" cols="12">
          <!-- <bottomNavigation
            :items="navItems"
            :icons="navIcons"
            :componentIndex="navIndex"
            @selectItem="selectItem"
          /> -->
        </v-col>

        <v-col cols="4" class="text-left text-caption">
          <v-btn text plain :to="specialPath" :style="{ color: barTextColor }">
            <span> {{ $version }}: {{ bpName }}</span>
            <span v-if="showStatus"> {{ status }}</span>
          </v-btn>
        </v-col>

        <v-col v-if="manage" cols="4" class="text-center text-caption">
          <v-btn x-small color="accent" @click="managePk(true)" :style="{ color: barTextColor }">
            {{ shortenedPk }}
          </v-btn>
        </v-col>

        <v-col cols="4" class="text-right pr-5">
          <v-btn icon x-small @click="ladybug = !ladybug" :style="{ color: barTextColor }"
            ><v-icon>mdi-ladybug</v-icon></v-btn
          >

          <span class="text-caption" :style="{ color: barTextColor }">{{ $country }}: </span>
          <v-icon small :color="barTextColor">{{ icon }} </v-icon>
        </v-col>
      </v-row>
    </v-footer>

    <confirm-dialog ref="confirm" />
    <confirm-dialog ref="managePks">
      <v-form ref="form" v-model="isValid">
        <v-text-field
          v-model="addThisPk"
          label="Enter another PK here"
          persistent-hint
        ></v-text-field
      ></v-form>
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
            label="PIN"
            hint="Manage your PKs"
            persistent-hint
            counter
            maxlength="6"
          ></v-text-field
        ></v-form>
      </v-card>
    </confirm-dialog>

    <confirm-dialog ref="pkRing">
      <v-card flat max-width="400" class="mx-auto my-2 text-center">
        <v-card-title>Your Primary Key Ring</v-card-title>
        <v-card-subtitle> Manage multiple Primary Keys with this advanced dialog. </v-card-subtitle>

        <v-row align="start">
          <!-- create pk -->
          <v-col cols="6">
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <v-btn text @click="addPk">
                  <v-icon class="mt-3" color="green" v-bind="attrs" v-on="on">
                    mdi-key-link
                  </v-icon>
                  Create PK
                </v-btn>
              </template>
              <span>Create a PK</span>
            </v-tooltip>
          </v-col>

          <v-spacer />

          <!-- add pk -->
          <v-col cols="6">
            <v-dialog v-model="dialog" width="500">
              <template v-slot:activator="{ on, attrs }">
                <v-btn text v-bind="attrs" v-on="on">
                  <v-icon class="mt-3" color="accent"> mdi-key-plus </v-icon>
                  Add PK
                </v-btn>
              </template>

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

                <v-divider></v-divider>

                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" text @click="addPkToRing"> Add </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>

        <v-divider class="mt-5" />

        <!-- key ring -->
        <v-row align="end">
          <v-col>
            <v-list two-line subheader>
              <v-list-item-group v-model="selectedItem" active-class="accent--text">
                <v-subheader>Your Primary Keys</v-subheader>
                <template>
                  <v-list-item v-for="item in items" :key="item.pk">
                    <template v-slot:default="{}">
                      <v-list-item-content>
                        <v-list-item-title>PK: {{ item.pk }}</v-list-item-title>

                        <v-list-item-subtitle
                          class="text--primary"
                          v-text="item.headline"
                        ></v-list-item-subtitle>

                        <v-list-item-subtitle>Opens cards: {{ item.opens }}</v-list-item-subtitle>
                      </v-list-item-content>

                      <v-list-item-action>
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on, attrs }">
                            <v-icon
                              color="error"
                              @click="removePkFromRing(item)"
                              v-bind="attrs"
                              v-on="on"
                            >
                              mdi-link-off
                            </v-icon>
                          </template>
                          <span>Remove</span>
                        </v-tooltip>
                      </v-list-item-action>
                    </template>
                  </v-list-item>
                </template>
              </v-list-item-group>
            </v-list>
          </v-col>
        </v-row>
      </v-card>
    </confirm-dialog>

    <confirm-dialog ref="reset" :validate="validate">
      <v-card flat max-width="500" class="mx-auto my-2 text-center">
        <div class="d-flex flex-column justify-space-between align-center">
          <v-img
            src="https://ik.imagekit.io/tqrtoken/Logo/Logo2_1.png"
            height="100"
            width="100"
          ></v-img>
        </div>

        <v-card-text class="pt-5 pb-1 text-h5">anonymous_activation</v-card-text>

        <div>Primary key services</div>
        <v-form class="mt-5" ref="formReset" v-model="resetIsValid">
          <v-row no-gutters align="center">
            <!-- PK -->
            <v-col cols="8" sm="4">
              <v-text-field
                v-model="newPk"
                placeholder="Enter/paste a PK to (re)use"
                label="Primary Key"
                hint="Your current PK"
                :rules="[rules.pk]"
                persistent-hint
                counter
                clearable
                style="font-size: 16px"
              />
            </v-col>

            <v-spacer v-if="!onPhone" />

            <!-- PIN -->
            <v-col cols="7" sm="4">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="newPin"
                    placeholder="We suggest a PIN"
                    hint="to secure your pk"
                    :rules="[rules.pin]"
                    persistent-hint
                    counter
                    label="PIN"
                    maxlength="6"
                    v-bind="attrs"
                    v-on="on"
                  />
                </template>
                <span>Optional safeguard to secure PIN</span>
              </v-tooltip>
            </v-col>
          </v-row>
        </v-form>

        <!-- QR -->
        <v-row align="center" class="pt-7">
          <v-col cols="12" class="pb-0"> QR code maps PK to another device </v-col>
          <v-col>
            <div class="pt-1 d-flex justify-center">
              <VueQRCodeComponent id="qr" ref="qr" :text="pkUrl" error-level="L" :size="100">
              </VueQRCodeComponent>
            </div>
          </v-col>
        </v-row>

        <v-divider />

        <v-card-actions class="mt-5">
          <v-spacer />
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-icon class="ma-n1" color="accent" large @click="emailPK" v-bind="attrs" v-on="on">
                mdi-email-outline</v-icon
              >
            </template>
            <span>Forward Primary Key </span>
          </v-tooltip>

          <v-spacer />

          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-icon
                class="ma-n1"
                color="accent"
                large
                @click="managePkRing"
                v-bind="attrs"
                v-on="on"
              >
                mdi-key-chain</v-icon
              >
            </template>
            <span>Primary Key Ring </span>
          </v-tooltip>
          <v-spacer />
        </v-card-actions>
      </v-card>
    </confirm-dialog>

    <confirm-dialog ref="newUserX">
      <v-card flat max-width="500" class="mx-auto my-2 text-center">
        <div class="d-flex flex-column justify-space-between align-center">
          <v-img
            src="https://ik.imagekit.io/tqrtoken/Logo/Logo2_1.png"
            height="100"
            width="100"
          ></v-img>
        </div>

        <v-card-text class="pt-5 pb-1 text-h5">anonymous activation</v-card-text>
        <v-card-text class="text-h6">no registration</v-card-text>
        <v-card-text class="text-h6">no app_download</v-card-text>
      </v-card>
    </confirm-dialog>

    <!-- Bars -->
    <toast :options="toastOptions"></toast>

    <!-- PWA snackbar -->
    <v-snackbar v-model="snackWithButtons" bottom left timeout="-1" height="100px">
      {{ snackWithBtnText }}
      <template v-slot:action="{ attrs }">
        <v-btn v-if="snackBtnText" text color="#00f500" v-bind="attrs" @click.stop="refreshApp">
          {{ snackBtnText }}
        </v-btn>
        <v-btn icon class="ml-4" @click="snackWithButtons = false">
          <v-icon>close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
    <!-- End PWA snackbar -->
  </v-app>
</template>

<script>
const Toast = () => import('@/components/toast.vue')
// const bottomNavigation = () =>
//   import('./components/tensor/bottomNavigation.vue');

import ConfirmDialog from './components/ConfirmDialog.vue'
import systemHeader from '@/components/systemHeader.vue'
const VueQRCodeComponent = () => import('vue-qr-generator')

import {
  connectionColor,
  // captureError,
  isEmpty,
  jl,
  jl3,
  pj,
  printByType,
  urlBuilder,
} from '../js/helpers'

import { mdiLanConnect, mdiLanDisconnect } from '@mdi/js'
import localStorageService from './services/localStorageService.js'
import { safeParseJSON } from '@/js/helpers.js'

export default {
  name: 'App',
  components: {
    systemHeader,
    Toast,
    ConfirmDialog,
    // bottomNavigation,
    VueQRCodeComponent,
  },

  computed: {
    pkUrl() {
      return `${location.origin}/${this.$pk}`
    },
    navItems() {
      return this.navItemsData
    },

    navItems1() {
      const navItems = this.isOrg
        ? this.navItemsData.filter((v) => v.title !== 'Personal')
        : this.navItemsData.filter((v) => v.title !== 'Organization')
      navItems.at(-1).title = 'Profile'
      return navItems
    },
    navItems0() {
      return this.isOrg
        ? this.navItemsData.filter((v) => v.title !== 'Personal')
        : this.navItemsData.filter((v) => v.title !== 'Organization')
    },

    showBottomNav() {
      return this.needFooterButtons
    },

    onPhone() {
      return this.$vuetify.breakpoint.xs
    },

    qrSize() {
      return this.onPhone ? 50 : 100
    },

    uniquePKs() {
      if (isEmpty(this.pks)) {
        return new Set()
      }
      const m2 = this.pks.map((item) => item.pk)
      return new Set(m2)
    },

    items() {
      const items = []
      for (const pk of this.uniquePKs) {
        const f = this.pks.filter((v) => v.pk === pk)
        items.push({ pk, opens: f.map((v) => v.label).join(', ') })
      }
      return items
    },

    messages() {
      return `Selected PK: ${this.selectedPk?.pk}`
    },

    newPkChanged() {
      console.log('this.newPk :>> ', this.newPk)
      return ''
    },

    // cachedPin() {
    //   const pin = localStorageService.getItem('pin');
    //   console.warn('pin:', pin);
    //   return pin;
    // },

    manage() {
      return true
    },

    shipMe() {
      return true
    },

    specialPath() {
      return this.shipMe ? '/' : '/?lru=1'
    },

    showStatus() {
      return !this.$vuetify.breakpoint.smAndDown
    },

    test() {
      console.log()
      return 'tested'
    },

    original() {
      return false
    },

    isAdmin() {
      return this.$pin.endsWith('$')
    },

    campaignUrl() {
      return this.$route.query.url ?? ''
    },
    nonce() {
      return this.$route.params.nonce ?? ''
    },

    shortenedPk() {
      return this.cid ? `...${this.cid.slice(9)}` : ''
    },

    cols() {
      return this.showIcons ? 'auto' : '1'
    },
    // button() {
    //   return this.onProducerOrDelegate ? mdiHome : mdiStorefront;
    // },
    // label() {
    //   return this.onProducerOrDelegate
    //     ? 'To Portal'
    //     : `To Producer (${this.path})`;
    // },
    icon() {
      return this.isConnected ? this.icons.connect : this.icons.disconnect
    },

    mainHeight() {
      return this.$vuetify.breakpoint.height - 48 - 36
    },

    version() {
      return this.$version
    },

    bpName() {
      return this.$vuetify.breakpoint.name
    },

    isConnected() {
      return this.client.connected
    },
    // pinConfirmed() {
    //   const ok = this.pin === this.cachedPin;
    //   return ok;
    // },
    barTextColor() {
      return this.$vuetify.theme.currentTheme.bartext
    },
  },

  sockets: {
    connected(id) {
      console.log('connected', id)
      // TODO this is coming in too late for Home2.vue to see the cid prop
      // TODO we need to render the <router-view></router-view> only after
      // connecting to the server here.
      this.cid = this.$pk ?? localStorageService.getItem('pk')
    },

    newUser(pk) {
      console.warn('App.newUser(pk) :>> ', pk)
      if (!pk) {
        return
      }
      localStorageService.setItem('pk', pk)
      // it took till build 1.11.01.13 to fix this null ref to this.$pk
      this.$pk = pk

      this.newPk = pk
      this.cid = pk // cid used in shortenPk() and copy()

      this.pin = this.checkPin()

      // To get both reward obx and tensorPath obx to work
      if (isEmpty(this.tensorPath)) {
        this.obx = true
      } else if (this.obx) {
        return this.$refs.newUser
          .open({
            title: 'Welcome',
            prompt: pk,
            defaultVal: '',
            options: {
              color: 'primary',
              width: 600,
              noconfirm: true,
            },
          })
          .then((ok) => {
            if (ok) {
              this.obx = true
            }
          })
      } else {
        // location.href = `${this.tensorPath}/${pk}`;
        //this.$router.push({name:'Tensor.Links.Vid'})
      }
      // });
    },
  },

  data() {
    return {
      offline: true,
      isTensor: true,
      oops: null,
      oopsArray: [],
      isOrg: null,
      needFooterButtons: null,
      hasTree: false,

      selectedOrg: false,
      navIcons: [
        'mdi-card-account-details-outline',
        'mdi-sitemap-outline',
        'mdi-school-outline',
        'mdi-vector-link',
        'mdi-file-document-outline',
      ],
      navIndex: -1, // start with Guide

      obx: false,

      email: '',
      tensorData: '',
      dialog: false,
      extantPk: '',
      extantPkLabel: '',
      selectedItem: '',
      adding: false,
      addThisPk: '',
      selectedPk: '',
      pks: [],

      isValid: false,
      resetIsValid: false,

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
      cachedPin: '',
      newPin: '',
      securedPin: '',

      status: '',
      context: '',
      log: '',
      et: 0,

      onPortal: false,
      drawer: false,
      lastNonce: '',
      timer: 0,
      cid: '',
      componentIndex: { offer: this.$blankComponent - 1 },
      onRootRoute: true,
      onProducerOrDelegate: false,
      hasTokens: false,
      client: this.$socket.client,

      icons: { connect: mdiLanConnect, disconnect: mdiLanDisconnect },

      showSystemFooter: false,
      showIcons: false,
      showHome: false,
      active: 'secondary',
      inactive: 'accent2',
      swipeDirection: 'None',

      comp: this.$blankComponent, // blank component
      path: '',
      tensorPath: '',

      toastOptions: {
        showToast: false,
        text: '',
        button: '',
        timeout: 5000,
        centered: true,
        other: { top: false },
      },

      overlay: true,
      snackBtnText: '',
      snackWithButtons: false,
      snackWithBtnText: '',

      // for PWA
      refreshing: false,
      registration: null,
      updateExists: false,

      fill: 'white',
      newPk: '',
      ladybug: false,
    }
  },

  methods: {
    onError(oopsArray) {
      this.oops = oopsArray.length
      this.oopsArray = oopsArray
    },
    onMountedHome() {
      // this.showGuide = true;
    },
    onActivatedHome() {
      // this.showGuide=false
    },
    onGoToProfile() {
      this.selectItem(-1)
    },

    onHideFooter() {
      this.showSystemFooter = false
    },
    handleShowHeader() {
      this.showSystemFooter = true
    },
    selectItem(index, refresh = false) {
      // at this writing, Topics is not part of Home, it's its own route
      if (index === 3) {
        this.$router.push({ name: 'Tensor.Topics.All' })
        return
      }
      // if we are Home, just display the appropriate component...
      if (this.$route.name === 'Home') {
        // we only have two buttons, and one is either Personal or Organization
        // this.selectedOrg = index === 2;
        // ensure we see a recent added vid if we go back to Profile from Tensors
        this.navIndex = index
        this.$route.params.index = index
        this.$route.params.navIndex = index
        jl3('APP.VUE  selectItem() set route to ', this.$route.params)
        return
      }

      // ...else go back Home with new params
      this.navIndex = index
      // this.selectedOrg = index === 2;
      // TODO pri1/sev2 whey do we have two uses for navIndex?
      const params = {
        indexedComponent: this.navIndex,
        navIndex: this.navIndex,
        selectedOrg: this.selectedOrg,
      }
      this.$router.push({ name: 'Home', params })

      console.log()
      if (refresh) {
        jl('reloading with params', params)
        location.reload()
      }
    },

    checkPin() {
      const value = localStorageService.getItem('pin')
      const pin = isNaN(parseInt(value, 10)) ? '' : value
      localStorageService.setItem('pin', pin)
      return pin
    },

    emailPK() {
      const currentURL = window.location.href
      const subject = 'Your TQR PK'
      const body = `Click the following link: ${currentURL}${this.$pk}`

      // Encode the subject and body for the mailto: link
      const encodedSubject = encodeURIComponent(subject)
      const encodedBody = encodeURIComponent(body)

      // Construct the mailto: link
      const mailtoLink = `mailto:${this.email}?subject=${encodedSubject}&body=${encodedBody}`
      console.log('href :>> ', mailtoLink)

      // Open the email client
      window.location.href = mailtoLink
    },

    onTensorUpdated() {
      this.selectItem(0)
    },

    onTensorUpdated0(context) {
      console.log('context :>> ', pj(context))
      const tensorData = context.vids.map((vid) => ({
        id: vid.id,
        label: vid.label,
        tensors: vid.tensors,
        links: context.links,
      }))
      this.tensorData = tensorData
      console.log('this.tensorData :>> ', pj(this.tensorData))
      console.log()
    },

    // passed as a prop to ConfirmDialog
    validate() {
      return this.$refs.formReset.validate()
    },

    noop() {
      console.warn('NOOP')
    },
    getMessage() {
      console.log(this.$pk)
      console.log()
      return this.$pk
    },

    toast(msg, button = 'Ok', timeout = 4000, fnc = null) {
      this.toastOptions.text = msg
      this.toastOptions.button = button
      this.toastOptions.timeout = timeout
      this.toastOptions.fnc = fnc
      this.toastOptions.showToast = true
    },

    userAgent() {
      return navigator.userAgentData
        .getHighEntropyValues([
          'architecture',
          'model',
          'bitness',
          'platformVersion',
          'fullVersionList',
        ])
        .then((ua) => ua)
    },

    makeCampaignUrl({ origin, cid }) {
      const url = urlBuilder({
        route: [],
        search: [
          ['n', this.nonce],
          ['cid', cid],
        ],
        origin,
      })

      // replace spaces with '+
      encodeURIComponent(url.search).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
      )
      console.log('url :>> ', url.href)
      return url.href
    },

    getCachedPin() {
      const pin = this.checkPin()
      console.warn('pin:', pin)
      return pin
    },
    managePk() {
      if (this.$route.name != 'Home') {
        this.$router.push({ name: 'Home' })
      }
      if (this.cachedPin) {
        this.managePin()
      } else {
        this.editCreds()
      }
    },
    managePkRing() {
      this.pks = safeParseJSON(localStorageService.getItem('pks'))

      return this.$refs.pkRing
        .open({
          title: 'Your Primary Key Ring',
          prompt: true,
          options: {
            color: 'primary',
            width: 600,
            noconfirm: false,
            showAgreeButton: true,
          },
        })
        .then((ok) => {
          if (!ok) {
            this.$refs.pkRing.close()
          }
        })
    },

    // this function is called only if there is a cachedPin
    managePin(pk = this.$pk) {
      this.newPin = this.getCachedPin()
      this.securedPin = ''
      return this.$refs.managePin
        .open({
          title: 'primary_key_manager',
          prompt: pk,
          options: {
            color: 'primary',
            width: 600,
            noconfirm: false,
            showAgreeButton: false,
          },
        })
        .then((ok) => {
          if (!ok) {
            this.$refs.managePin.close()
          }
        })
    },

    // this code will run with the MANAGE button until a PIN is cached
    // at that time managePin() above will always appear and the
    // correct PIN entered before this function will be called
    editCreds() {
      const pk = localStorageService.getItem('pk')
      this.newPin = this.getCachedPin()

      const reload = (ok) => {
        if (ok) {
          location.reload()
        }
      }

      const reset = (ok) => {
        if (!ok) {
          return
        }
        if (this.newPk && !this.newPk.includes('-')) {
          alert('app.your_pk_must_be_blank')
          return
        }
        const msg = []
        if (!this.newPk) {
          localStorageService.removeItem('pk')
          msg.push(`PK removed.`)
        } else if (this.newPk != this.$pk) {
          localStorageService.setItem('pk', this.newPk)
          msg.push(`PK changed to: ${this.newPk}.`)
        }
        if (this.newPin != this.cachedPin) {
          localStorageService.setItem('pin', this.newPin)
          msg.push(this.newPin ? `PIN changed to ${this.newPin}.` : 'PIN removed')
        }
        const message = msg.join('\n')
        console.log(message)

        this.$pk = this.newPk
        this.cid = this.$pk
        if (!this.adding && message.length) {
          this.toast(message, 'Thanks', 5000, () => reload(ok))
        }
        location.reload()
      }

      return this.$refs.reset
        .open({
          title: 'Primary Key manager',
          prompt: pk,
          defaultVal: pk,
          options: {
            color: 'primary',
            width: 600,
            noconfirm: false,
            showAgreeButton: true,
          },
        })
        .then((ok) => {
          reset(ok)
        })
    },

    copy() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(this.cid)
        this.toastOptions.text = `Copied ${this.cid}. Save key in your Contact app contact card.`
        this.toastOptions.timeout = 10000
      } else {
        this.toastOptions.text = `Copy ${this.cid}, then save it in your Contact app contact card.`
        this.toastOptions.timeout = -1
      }
      this.toastOptions.button = 'Thanks'
      this.toastOptions.showToast = true
    },

    onTokensAdded(nonce) {
      this.lastNonce = nonce
      console.log('onTokensAdded().nonce :>> ', nonce)
      console.log(' ')
    },
    onTimerStopped(timer) {
      this.timer = timer
    },

    goto() {
      this.onProducerOrDelegate ? this.toPortal() : this.toProducer()
    },
    notEvent() {
      const isEvent = this.path.includes('&r=')
      if (isEvent) {
        this.compChangedTo(1)
        return false
      }
      return true
    },

    onHideIcons() {
      this.showIcons = false
    },
    onShowIcons() {
      this.showIcons = true
    },
    unpackError(e) {
      const msg = `App reports:
      ${e.message}`
      console.error(msg)
      alert(msg)
    },

    onShowHome(val) {
      this.showHome = val
    },
    onSwiped(n) {
      // to restore swipe, put this back in template in <router-view @swiped="onSwiped"></router-view>
      const gt2 = () => (x > 2 ? 0 : x)

      const x = this.comp + n
      this.comp = x < 0 ? 2 : gt2()
      console.log('this.comp :>> ', this.comp)
    },
    compChangedTo(n) {
      this.comp = n
      this.overlay = false
    },

    contextChanged(context) {
      this.context = context
    },

    // called by Links.vue: newCard()
    // Home2.vue: onAddedProfile()
    //            created()
    onNeedFooterButtons({ isObx, isOrg, hasTree, reload }) {
      this.needFooterButtons = true
      this.obx = isObx ? isObx : this.obx
      this.hasTree = hasTree
      this.isOrg = isOrg
      if (reload) {
        location.reload()
      }
    },

    // event sources:
    // Portal.onChangedConnection() [for Aegis with Loyalty Tokens or with Event Tokens]
    onPathChanged(path, isCampaign) {
      // Producer.mounted()
      this.path = path
      if (!path) {
        this.onRootRoute = true
        return
      }
      this.onRootRoute = false

      // TODO only show Producer icon if pk is an owner
      this.onProducerOrDelegate =
        this.$router.currentRoute.name.startsWith('Producer') ||
        this.$router.currentRoute.name.startsWith('Delegate')
      printByType(connectionColor, 'this.path :>> ', this.path)
      const n = isCampaign ? 0 : 1
      this.compChangedTo(n)
    },

    toPortal() {
      this.onProducerOrDelegate = false
      this.$router.push('/portal')
    },
    toProducer() {
      this.onProducerOrDelegate = true
      this.$router.push(this.path)
    },

    showRefreshUI(e) {
      // TODO add back a generic <snackBar> component (see line 140 of AppOrig.js)
      // Display a snackbar inviting the user to refresh/reload the app due
      // to an app update being available.
      // The new service worker is installed, but not yet active.
      // Store the ServiceWorkerRegistration instance for later use.
      // Suppress the Refresh for /view/rewards and /view/events as it interferes the
      // token earning and burning process
      if (
        !this.$route.path.startsWith('/view/rewards') &&
        !this.$route.path.startsWith('/view/events')
      ) {
        this.action = 'refresh'
        this.registration = e.detail
        this.updateExists = true

        this.snackBtnText = 'Refresh'
        this.snackWithBtnText = 'New version available!'
        this.snackWithButtons = true
        console.log('Rendering Refesh snackbar')
        console.log(' ')
      }
    },
    showOfflineUI() {
      this.snackBtnText = 'Offline'
      this.snackWithBtnText =
        'You are offline right now. You can use the Recent Visits list, however.'
      this.snackWithButtons = true
      console.log('Rendering Offline snackbar')
    },
    refreshApp() {
      this.updateExists = false

      this.snackWithButtons = false

      // TODO What is this next block for?
      // Protect against missing registration.waiting.
      if (!this.registration || !this.registration.waiting) {
        return
      }

      this.registration.waiting.postMessage('skipWaiting')
    },

    onStatusChange(val) {
      this.status = val
    },

    onDebug(val) {
      this.log += pj(val)
    },

    addPk() {
      localStorageService.setItem('pk', '')
      location.reload()
    },

    addPkToRing() {
      this.dialog = false
      const newPk = { label: this.extantPkLabel, pk: this.extantPk }
      if (this.pks) {
        this.pks.push(newPk)
      } else {
        this.pks = [newPk]
      }
      localStorageService.setItem('pks', pj(this.pks))
    },
    removePkFromRing(item) {
      console.log(pj(item))
      console.log()
      this.pks = this.pks.filter((v) => v.pk != item.pk)

      localStorageService.setItem('pks', pj(this.pks))
    },

    addMe(label) {
      this.adding = true
      return this.$refs.managePks
        .open({
          title: 'Manage PKs',
          prompt: label,
          options: {
            color: 'primary',
            width: 600,
            noconfirm: false,
            showAgreeButton: true,
          },
        })
        .then((pk) => {
          // hit cancel
          if (!pk) {
            this.$refs.managePks.close()
            return
          }
          console.log(pk)
          const newPk = { label, pk: this.addThisPk }
          console.log('newPk :>> ', pj(newPk))
          this.pks.push(newPk)
          localStorageService.setItem('pks', pj(this.pks))
          this.newPk = newPk.pk
          this.adding = false
        })
    },

    triggerError() {
      // Throw an error deliberately
      throw new Error('Deliberate error for testing in APP.vue')
    },
  },

  watch: {
    selectedItem(selectedItem) {
      console.log('selectedItem :>> ', selectedItem)

      const selected = this.items?.[selectedItem]
      if (!selected || !selected.pk) {
        console.warn('Selected item is invalid or missing pk:', selected)
        this.selectedPk = null
        return
      }

      const pk = selected.pk
      console.log('Resolved pk from items:', pk)

      if (Array.isArray(this.pks)) {
        this.selectedPk = this.pks.find((v) => v.pk === pk)
        console.log('selectedPk resolved to:', this.selectedPk)
      } else {
        console.warn('pks is not an array or is unset:', this.pks)
        this.selectedPk = null
      }
    },
    // selectedItem(selectedItem) {
    //   console.log("selectedItem :>> ", selectedItem);
    //   console.log(this.items[selectedItem]);
    //   const pk = this.items[selectedItem].pk;
    //   // this.selectedPk = this.pks?.find((v) => v.pk === pk);
    //   if (Array.isArray(this.pks)) {
    //     this.selectedPk = this.pks.find((v) => v.pk === pk);
    //   } else {
    //     console.warn("pks is not an array:", this.pks);
    //     this.selectedPk = null;
    //   }
    // },

    selectedPk(selectedPk) {
      if (isEmpty(selectedPk)) {
        return
      }
      console.log('selectedPk :>> ', selectedPk)
      // add a pk
      // if (typeof selectedPk === 'string') {
      //   this.addMe(selectedPk);
      // }
      // // using the pk
      // else {
      this.newPk = selectedPk.pk
      this.$pk = this.newPk
      this.cid = this.$pk
      localStorageService.setItem('pk', this.$pk)
      this.$reload = true
      // }
    },

    tensorPath(tensorPath, tensorPath0) {
      console.warn('\npathName :>> ', tensorPath, tensorPath0)
      console.log()
    },

    securedPin(securedPin) {
      console.log('securedPin :>> ', securedPin)
      this.newPin = securedPin

      if (this.securedPin === this.getCachedPin()) {
        if (this.$refs.form.validate()) {
          this.$refs.managePin.close()

          this.editCreds()
        }
      }
    },
  },

  created() {
    console.time('Created PWA:')
    //#region PWA
    // Listen for swUpdated event and display refresh snackbar as required.
    document.addEventListener('swUpdated', this.showRefreshUI, { once: true })
    // document.addEventListener('offline', this.showOfflineUI, { once: true });
    // Detect offline status
    window.addEventListener(
      'offline',
      () => {
        console.log('App is offline')
        this.isOffline = true
        // this.stopSpinner();  // Call method to stop spinner
        this.showOfflineUI() // Optional: Show offline UI message
      },
      { once: true }
    )

    // Detect online status
    window.addEventListener('online', () => {
      console.log('App is back online')
      this.isOffline = false
      // this.startSpinner();  // Optionally restart spinner when back online
    })

    // Refresh all open app tabs when a new service worker is installed.
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (this.refreshing) return
        this.refreshing = true
        window.location.reload()
      })
    }

    document.addEventListener('appinstalled', () => {
      console.log('PWA was installed')
    })
    //#endregion PWA

    console.timeEnd('Created PWA:')

    // to ensure the managePk text field isn't blank
    this.newPk = this.$pk
  },

  mounted() {
    const title = 'Tensors' // this.hasTree ? 'Tensors' : 'Guide';
    const icon = this.navIcons[3] //this.hasTree ? this.navIcons[1] : this.navIcons[2];
    this.navItemsData = [
      { title, icon },
      { title: 'Personal', icon: this.navIcons[0] },
      { title: 'Organization', icon: this.navIcons[1] },
      { title: 'Topics', icon: this.navIcons[4] },
    ]
    // this.ladybug = this.$country === '19' ? true : false;

    this.pks = safeParseJSON(localStorageService.getItem('pks'))
    // this.selectedPk = this.pks?.find((v) => v.pk === this.$pk);
    if (Array.isArray(this.pks)) {
      this.selectedPk = this.pks.find((v) => v.pk === this.$pk)
      console.log('selectedPk resolved to:', this.selectedPk)
    } else {
      console.warn('pks is not an array or is unset:', this.pks)
      this.selectedPk = null
    }
    console.log('this.selectedPk :>> ', pj(this.selectedPk))

    console.log('Incoming querystring:', JSON.stringify(this.$route.query, null, 2))
    console.log('Incoming params:', JSON.stringify(this.$route.params, null, 2))
    console.log('Incoming meta:', JSON.stringify(this.$route.meta, null, 2))

    this.tensorPath = window.location.pathname.includes('tensor') ? '/tensor' : ''
    console.log('this.tensorPath :>> ', this.tensorPath)
    console.log()

    if (this.campaignUrl) {
      window.location.href = this.makeCampaignUrl({
        origin: this.campaignUrl,
        cid: this.cid,
      })
    }

    // locale setting persistence
    // if (localStorageService.getItem("locale")) {
    //   this.$i18n.locale = localStorageService.getItem("locale");
    // } else {
    //   localStorageService.setItem("locale", this.$i18n.locale);
    // }

    this.cachedPin = this.getCachedPin()

    this.onRootRoute = !this.cachedPin ? '/access' : this.$router.currentRoute.path === '/'
    this.onPortal = window.location.pathname === '/portal'

    this.onDebug(`On Root Route: ${this.onRootRoute}`)

    console.log('\tAPP mounted', this.mainHeight, 'tall')
    console.log(1 / 0)
  },

  // errorCaptured(err, vm, info) {
  //   const { name, path } = this.$route;

  //   const context = {
  //     title: 'Trouble in an APP.vue component',
  //     cid: this.$pk,
  //     props: this.$props,
  //     route: { name, path },
  //   };

  //   // handles issues undetected by main parent components,
  //   // Home2.vue, Links.vue, and Vcard.vue
  //   // e.g., see how error is handled in personal/vcard.vue
  //   captureError(this.client, err, vm, info, context).then((oopsArray) => {
  //     this.oops = oopsArray.length;
  //     this.oopsArray = oopsArray;
  //   });

  // return false; // Prevent the error from propagating further
  // },
}
</script>

<style>
.break-word {
  word-break: break-word; /* or break-all */
}
</style>

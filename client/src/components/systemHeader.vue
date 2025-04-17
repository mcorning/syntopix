<template>
  <v-system-bar v-if="showHeader" id="sysBar" ref="sysBar" app color="primary" dark height="48">
    <v-col cols="2">
      <v-dialog v-model="avatar" width="500">
        <template v-slot:activator="{ on, attrs }">
          <v-avatar v-if="showAvatar" color="accent" tile size="36 " v-bind="attrs" v-on="on">
            <span
              class="text-h6"
              :style="{ color: barTextColor }"
              v-text="cid.slice(11, 13)"
            ></span>
          </v-avatar>
        </template>

        <v-card>
          <v-card-title class="text-h5 accent2 lighten-2"> The TQR Tensor Space... </v-card-title>
          <v-card-subtitle class="accent2 lighten-2"
            >...owned by your Primary Key ending in
            <strong>{{ shortenedPk }}</strong></v-card-subtitle
          >

          <v-card-actions>
            <v-btn color="primary" text tile @click="avatar = false"> close </v-btn>
          </v-card-actions>
          <v-card-title> Contents of localStorage: </v-card-title>

          <v-divider></v-divider>
          <v-card-text>
            <pre>{{ localStorageContents }}</pre>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn color="primary" text tile @click="clearLocalStorage"> Clear localstorage </v-btn
            ><v-spacer
          /></v-card-actions>
        </v-card>
      </v-dialog>
    </v-col>
    <v-spacer />

    <v-tooltip bottom>
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          color="primary"
          text
          large
          plain
          class="font-weight-black pl-0 accent2--text"
          :to="specialPath"
          v-bind="attrs"
          v-on="on"
        >
          <svgIcon v-if="defaultTheme" />
          <img v-else :src="headerLogo" :height="36" />
        </v-btn>
      </template>
      <span>Go to Profile</span>
    </v-tooltip>

    <v-spacer />
    <v-col cols="2" class="d-flex justify-end">
      <!-- <div class="langSelect" :style="{ color: barTextColor }">
        <v-select
          @change="updateLocale()"
          v-model="$i18n.locale"
          :items="$i18n.availableLocales"
          dense
        >
          <template v-slot:item="slotProps">
            <v-img class="langFlag" :src="`/locale-icons/${slotProps.item}.png`"></v-img>
            <span class="langCode">{{ slotProps.item }}</span>
          </template>
        </v-select>
      </div> -->
    </v-col>
  </v-system-bar>
</template>

<style>
.langSelect {
  max-width: 5.5em;
  margin-top: 1em;
}
.langSelect .v-select__selections {
  color: inherit !important;
  margin-left: 1em;
}
.langSelect .v-select__slot {
  font-size: 0.8em;
}
.langSelect .v-input {
  color: inherit !important;
}
.langSelect .v-icon {
  color: inherit !important;
}
.langSelect .v-input__slot::before {
  border-color: inherit !important;
}
.langFlag {
  max-width: 32px;
}
.langCode {
  font-size: 0.9em;
}
</style>

<script>
import svgIcon from '@/components/svgIcon.vue'
import localStorageService from '@/services/localStorageService.js'

// not needed for Tensors/Syntopix
// import { TARGET_NAMES } from '../../srv/ops/rewards';
// import { TARGET_NAMES as TARGET_NAMES_CAMPAIGNS } from '../../srv/ops/campaigns';
// const ALL_TARGET_NAMES = { ...TARGET_NAMES, ...TARGET_NAMES_CAMPAIGNS };
import { emitFromClient, emitFromClient2, jl } from '../js/helpers.js'

export default {
  data() {
    return {
      defaultTheme: true,
      showHeader: false,
      showAvatar: false,
      cid: this.$pk,
      localStorageContents: '',
      avatar: false,
      role: '',
      nonce: '',
      eventName: '',
    }
  },
  components: {
    svgIcon,
  },
  computed: {
    shortenedPk() {
      return this.cid ? `...${this.cid.slice(9)}` : ''
    },
    shipMe() {
      return true
    },
    specialPath() {
      return this.shipMe ? '/' : '/?lru=1'
    },
    path() {
      // $route and $router are both empty when App.vue first loads
      return window.location.pathname
    },
    client() {
      return this.$socket.client
    },
    barTextColor() {
      return this.$vuetify.theme.currentTheme.bartext
    },
    headerLogo() {
      return this.$vuetify.theme.currentTheme.headerlogo
    },
  },
  created() {
    if (this.path.startsWith('/view/rewards') || this.path.startsWith('/view/events')) {
      const part = this.path.split('/')
      this.nonce = part[3]
      if (part[2] === 'rewards') {
        this.role = 'rewards'
      } else {
        this.role = 'campaigns'
        this.eventName = part[4]
      }

      this.scanConnections().then((value) => {
        console.log(value[0])
        const connection = value[0][0].split(':')
        this.getTheme(connection[2]).then((value) => {
          this.showTheme(value)
        })
      })
    }
    // else if is here for performance reason
    else if (
      this.path.startsWith('/campaign') ||
      this.path.startsWith('/reward') ||
      this.path.startsWith('/theme')
    ) {
      this.getTheme(this.$pk).then((value) => {
        this.showTheme(value)
      })
    }
    // this else is required until a suitable location is determined for storing themes not with tqr:country preamble
    else {
      this.showAvatar = true
      this.showHeader = true
      this.$emit('showHeader', 'true')
    }
  },
  watch: {
    avatar(is, was) {
      jl(`needsLocalStorage`, { is, was })

      if (is) {
        this.getLocalStorage()
      }

      jl('this.localStorageContents', this.localStorageContents)
      console.log()
    },
  },
  methods: {
    showTheme(value) {
      // As long as a primary color is set, we assume a custom theme
      if (value.primaryColor !== undefined && value.primaryColor !== '') {
        this.defaultTheme = false
        this.$vuetify.theme.currentTheme.primary = value.primaryColor
        this.$vuetify.theme.currentTheme.accent = value.accentColor
        this.$vuetify.theme.currentTheme.bartext = value.barTextColor
        this.$vuetify.theme.currentTheme.headerlogo = value.headerLogo
      }
      this.showHeader = true
      this.$emit('showHeader', 'true')
    },
    getTheme(pk) {
      const preamble = this.$preambleBase
      const owner = pk
      const hash = 'theme'
      const role = 'theme'
      const key = {
        preamble,
        owner,
        hash,
      }
      const context = {
        crd: 'getJson',
        context: { key },
      }

      console.log(context)

      const caller = 'Theme.getJson'
      return new Promise((resolve) => {
        emitFromClient2(
          this.client,
          role,
          context,
          (response) => {
            console.log('response: :>>', response)
            resolve(response)
          },
          caller
        )
      })
    },
    scanConnections() {
      const nonce = this.nonce ?? '*'

      const preamble = this.$preambleBase
      const pid = '*'

      const targetName = '' // ALL_TARGET_NAMES.connections;

      const context = {
        preamble,
        nonce,
        pid,
      }

      const role = this.role
      return new Promise((resolve) => {
        emitFromClient(this.client, role, context, targetName, (map) => resolve(map))
      })
    },
    getLocalStorage() {
      this.localStorageContents = ''
      for (let key of Object.keys(localStorage)) {
        let value = localStorageService.getItem(key)
        this.localStorageContents += `{key: ${key}, Value: ${value}\n`
      }
      jl('localStorageContents', this.localStorageContents)
    },
    clearLocalStorage() {
      const pk = localStorageService.getItem('pk')
      localStorageService.clear()
      localStorageService.setItem('pk', pk)
      this.getLocalStorage()
    },
    // updateLocale() {
    //   localStorageService.setItem("locale", this.$i18n.locale);
    // },
  },
}
</script>

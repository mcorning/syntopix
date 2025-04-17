import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'
import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    themes: {
      dark: {
        primary: '#0E1B6F',
        accent: '#7C83FD',
        secondary: '#F2A154',
        accent2: '#ECEEF6',
        bartext: '#FFFFFF',
        background: '#FFFFFF',
        error: colors.red.accent3,
      },
      light: {
        primary: '#0E1B6F',
        accent: '#7C83FD',
        secondary: '#F2A154',
        accent2: '#ECEEF6',
        bartext: '#FFFFFF',
        background: '#FFFFFF',
        error: colors.red.accent3,
      },
    },
  },
})

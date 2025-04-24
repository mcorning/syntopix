// src/plugins/vuetify.js
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'

const customTheme = {
  dark: false,
  colors: {
    primary: '#0E1B6F',
    accent: '#7C83FD',
    secondary: '#F2A154',
    accent2: '#ECEEF6',
    bartext: '#FFFFFF',
    background: '#FFFFFF',
    error: '#ff5252',
  },
}

export default createVuetify({
  blueprint: md3,
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme,
    },
  },
})

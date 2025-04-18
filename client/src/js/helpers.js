// File: src/js/helpers.js (Frontend specific)

const clc = {
  connectionColor: 'color: #FF00FF;', // Magenta
  errorColor: 'color: #FF0000;', // Red
  warnColor: 'color: #FFA500;', // Orange
  infoColor: 'color: #0000FF;background-color:white', // Blue
  lookAtMeColor: 'color: white; background-color:red',
  headingColor: 'color: black; background-color:yellow',
  oopsColor: 'color: black; background-color:red',
  url: 'color: black; background-color:cyan',
  passedColor: 'color: black; background-color:green',
  yellow: 'color: yellow',
  cyan: 'color: cyan',
  auditColor: 'color: yellow; background-color:black',
}
function connectionColor(message, data) {
  console.log(`%c${message}`, data, clc.connectionColor)
}

// expose colors as needed:
// function headingColor(message) {
//   console.log(`%c${message}`, clc.headingColor);
// }
// function lookAtMeColor(message) {
//   console.log(`%c${message}`, clc.lookAtMeColor);
// }
// function oopsColor(message) {
//   console.log(`%c${message}`, clc.oopsColor);
// }
// function url(message) {
//   console.log(`%c${message}`, clc.url);
// }
// function passedColor(message) {
//   console.log(`%c${message}`, clc.passedColor);
// }
// function offerColor(message) {
//   console.log(`%c${message}`, clc.yellow);
// }
function infoColor(message) {
  console.log(`%c${message}`, clc.infoColor)
}
function auditColor(k, v) {
  console.log(
    `%c${k}
${v}`,
    clc.yellow
  )
}

/* Example urlBuilder() usage:
const vue = '/producer'; //blank vue returns root route (viz., Consumer)
const owner = '1664155972140-0'; //comes from $route.params (blank value is not in url)
const nonce = 'mpc@test'; //comes from $route.params (blank value is not in url)
const eventName = 'trial by jury'; // comes from $route.query
const redir = ''; // comes from $route.query

// const origin = new URL('http://localhost:3333/');
const url = urlBuilder({
  route: [vue, owner, nonce],
  search: [
    ['e', eventName],
    ['b', redir],
  ],
  origin,
});
*/
const urlBuilder = ({ route, search, origin = new URL(window.location.origin) }) => {
  // only use route elements with a value
  try {
    const url = new URL(route.filter((v) => v).join('/'), origin)
    // only use searchParams with a value
    search.forEach(([key, val]) => {
      url.searchParams.set(key, val)
    })
    return url
  } catch (error) {
    const e = `${error}
    origin: ${origin}`
    alert(e)
  }
}

const printByType = (color, heading, data, note) => {
  console.log(
    clc[color](`${heading}
  ${pj(data)}
  NOTE: ${note ? note : 'no comment'}`)
  )
}
function safeParseJSON(json, fallback = null) {
  if (!json) {
    return {}
  }
  try {
    return JSON.parse(json)
  } catch (error) {
    console.error('Error parsing JSON:', error, 'Input:', json)
    return fallback
  }
}

function pj(json) {
  return JSON.stringify(json, null, 2)
}
function sj(json) {
  return JSON.stringify(json)
}

function clj(json, msg = 'json') {
  console.log(msg, pj(json))
}

function myDate() {
  const date = new Date()
  return `${date.getDate()}/${
    date.getMonth() + 1
  }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`
}
function jl3(k, value) {
  jl(k, value, 3)
}
function isJSON(property) {
  return typeof property === 'object' && property !== null
}

function cl(k, v, color) {
  color(`${k}\n${v}`)
  return
}
// function cl(k, v, color = clc.cyan) {
//   console.log(k, ` :>> `, v, color);
//   return;
// }

function cw(k, v) {
  console.warn(k, ` :>> `, v)
}

function ce(k, v) {
  console.error(k, ` :>> `, v)
}

function jl(k, value, level = 0, color = infoColor) {
  // function jl(k, value, level = 0) {
  const getValue = isJSON(value) ? pj(value) : value
  const v = !value ? 'NA' : getValue
  const useColor = !value ? auditColor : color
  const match = {
    0: () => cl(k, v, useColor),
    1: () => cw(k, v),
    2: () => ce(k, v),
    3: () => jAudit(k, v),
  }
  if (match[level]) {
    return match[level]()
  }
}
function jAudit(k, v) {
  auditColor(k, v)
  console.log(' ')
}

function isEmpty(val) {
  if (val instanceof Map) {
    return val.size === 0
  }
  const isEmpty = val === undefined || val == null || val == '' || !(Object.keys(val) || val).length
  return isEmpty
}
const getTopicOrderKey = (spaceId) => {
  if (!spaceId) {
    throw new Error('Space ID is required to generate the topic order key.')
  }
  return `space:${spaceId}:topicOrder`
}

const deriveResponseType = (response) => {
  if (response.success) return 'success'
  if (response.prompt) return 'prompt'
  if (response.error) return 'error'
  return 'default'
}
// 🚀 Function to remove duplicate Topics from an spaces array below
const removeDuplicates = (array) => {
  return Array.from(new Set(array.map((t) => JSON.stringify(t)))).map((t) => JSON.parse(t))
}

const Audit = {
  auditArray: [],

  add(msg) {
    this.auditArray.push(msg)
  },
  halt(msg) {
    console.warn('\n\t', msg, '\n')
    this.report('HALTING')
  },

  report(title) {
    console.log('\n', title)
    console.log(`${new Date().toISOString()} Audit Report`)
    console.table(this.auditArray)
  },

  clear() {
    this.auditArray = []
  },
}

function getPkFromLocalStorage() {
  return this.$pk
}
function dateFromID(id, withTime = true) {
  if (!id) {
    return ''
  }
  return new Date(Number(id.slice(0, 13))).toString().slice(4, withTime ? 21 : 16)
}

export {
  safeParseJSON,
  pj,
  sj,
  clj,
  myDate,
  isEmpty,
  getTopicOrderKey,
  dateFromID,
  deriveResponseType,
  Audit,
  removeDuplicates,
  getPkFromLocalStorage,
  connectionColor,
  jl,
  jl3,
  urlBuilder,
  printByType,
}

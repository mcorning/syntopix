// File: src/js/helpers.js (Frontend specific)
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

module.exports = {
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
}

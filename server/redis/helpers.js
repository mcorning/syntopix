// File: srv/redis/syntopix/helpers.js (Backend specific)
const getNamespace = require('./config/redisNamespace').getNamespace;
const { getPk, setPk } = require('./cli/cliStorage');
const { redis } = require('./setup'); // Adjust the path to shared setup.js

const {
  safeParseJSON,
  pj,
  clj,
  getPkFromLocalStorage,
  myDate,
  isEmpty,
} = require('../utils/helpers');

function initializePk() {
  if (!pk) {
    const pk2 = `${Date.now()}-0`;
    setPk(pk2);
    redis.set(`19:syntopix:${pk}`, JSON.stringify({ created: Date.now() }));
    console.log(`Author's PK: ${pk}`);
  }
  return pk;
}
const namespace = getNamespace();
const pk = getPkFromLocalStorage() || getPk();
const keysMan = {
  topicStreamKey: `${namespace}:topics:stream`,
  pkSpacesKey: `${namespace}:pks:${pk}:spaces`,
  spaceOrderKey: `${namespace}:pks:${pk}:spaces:order`,
  pkTopicsKey: `${namespace}:pks:${pk}:topics`,
  topicContentKey: `${namespace}:topics:content`,
  topicSpaceKey: `${namespace}:topics:spaces`,
  topicOrderKey: `${namespace}:spaces:topics:order`,
  spaceKey: `${namespace}:spaces:${pk}`,
  pk,
};
// Utility to query arrays
function queryArray(input, func, array) {
  const isNumeric = /^\d+$/.test(input);
  if (isNumeric) {
    const index = parseInt(input, 10);
    if (index >= 0 && index < array.length) {
      return array[index]; // Query by index
    }
  }

  const isArrayOfObjects = typeof array[0] === 'object';
  if (isArrayOfObjects) {
    const match = array.find(func);
    if (match) return match;

    console.warn(`No match found for input: "${input}. Will add it."`);
    return input;
  } else {
    if (array.includes(input)) {
      return input; // Return the matched primitive value
    }
    console.warn(`Input "${input}" is new to the array.`);
    array.push(input); // Add the new input to the array
    return input;
  }
}

module.exports = {
  initializePk,
  keysMan,
  safeParseJSON,
  pj,
  clj,
  myDate,
  isEmpty,
  queryArray,
};

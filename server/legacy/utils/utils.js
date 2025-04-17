
const { highlight, url } = require('./helpers');
//const crypto = require('crypto');
//const randomId = () => crypto.randomBytes(8).toString('hex');

/**
 * It takes a list of promises and waits for them to resolve.
 * @param data - { key, score, reliability, arr }
 * @param fn - the function to run
 */
async function keepPromises(data, fn) {
  const { key, score, reliability, arr } = data;
  const unresolved = arr.map((vals) => fn(key, score, reliability, vals));

  const resolved = await Promise.all(unresolved).catch((e) => {
    console.log(e);
  });
  console.log(highlight('resolved', resolved));
  return resolved;
}
const filterOn = (arr, fn) =>
  arr
    .filter(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

/**
 *
 * @param {*} arr
 * @param {*} key
 * @returns object with keys provided by arr whose value does not include the key value
 */
const indexOn = (arr, key) =>
  arr.reduce((obj, v) => {
    const { [key]: id, ...data } = v;
    obj[id] = data;
    return obj;
  }, {});

const groupBy = (arr, fn) =>
  arr
    .map(typeof fn === 'function' ? fn : (val) => val[fn])
    .reduce((acc, val, i) => {
      acc[val] = (acc[val] || []).concat(arr[i]);
      return acc;
    }, {});

const getTimeFromSid = (sid) => Number(sid.slice(0, 13));
const getDateFromSid = (sid) => Number(sid.slice(0, 13));
const getShortDateFromSid = (sid) => Number(sid.slice(0, 13));
const isEmpty = (val) => val == null || !(Object.keys(val) || val).length;
const objectToKeyedArray = (obj) => {
  if (isEmpty(obj)) {
    return null;
  }
  const methods = {
    map(target) {
      return (callback) =>
        Object.keys(target).map((key) => callback(target[key], key, target));
    },
    reduce(target) {
      return (callback, accumulator) =>
        Object.keys(target).reduce(
          (acc, key) => callback(acc, target[key], key, target),
          accumulator
        );
    },
    forEach(target) {
      return (callback) =>
        Object.keys(target).forEach((key) =>
          callback(target[key], key, target)
        );
    },
    filter(target) {
      return (callback) =>
        Object.keys(target).reduce((acc, key) => {
          if (callback(target[key], key, target)) acc[key] = target[key];
          return acc;
        }, {});
    },
    slice(target) {
      return (start, end) => Object.values(target).slice(start, end);
    },
    find(target) {
      return (callback) => {
        return (Object.entries(target).find(([key, value]) =>
          callback(value, key, target)
        ) || [])[0];
      };
    },
    findKey(target) {
      return (callback) =>
        Object.keys(target).find((key) => callback(target[key], key, target));
    },
    includes(target) {
      return (val) => Object.values(target).includes(val);
    },
    keyOf(target) {
      return (value) =>
        Object.keys(target).find((key) => target[key] === value) || null;
    },
    lastKeyOf(target) {
      return (value) =>
        Object.keys(target)
          .reverse()
          .find((key) => target[key] === value) || null;
    },
  };
  const methodKeys = Object.keys(methods);

  const handler = {
    get(target, prop, receiver) {
      console.log('objectToKeyedArray().receiver', receiver);
      if (methodKeys.includes(prop)) return methods[prop](...arguments);
      const [keys, values] = [Object.keys(target), Object.values(target)];
      if (prop === 'length') return keys.length;
      if (prop === 'keys') return keys;
      if (prop === 'values') return values;
      if (prop === Symbol.iterator)
        return function* () {
          for (const value of values) yield value;
        };
      else return Reflect.get(...arguments);
    },
  };

  return new Proxy(obj, handler);
};

const delim = '#';

const getConnectionsCmd = (country, sid1, sid2) => {
  const a = [`${country}:connections`, sid1];
  if (sid2) {
    a.push(sid2);
  }
  return a;
};

const getTokensCmd = (country, nonce) => [`${country}:${nonce}${delim}tokens`];

const getOffersCmd = (country, nonce) => `${country}:${nonce}${delim}events`;
const getKey = (country, nonce, hash) => `${country}:${nonce}${delim}${hash}`;

module.exports = {
  filterOn,
  getConnectionsCmd,
  getKey,
  getOffersCmd,
  getTokensCmd,
  groupBy,
  indexOn,
  isEmpty,
  objectToKeyedArray,
  getDateFromSid,
  getShortDateFromSid,
  getTimeFromSid,
  keepPromises,
  //randomId,
  url,
};

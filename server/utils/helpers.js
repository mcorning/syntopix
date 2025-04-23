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
};
// see https://www.npmjs.com/package/cli-color
// const clc = require('cli-color');
// const url = clc.black.bold.bgCyanBright;
// const urlColor = clc.black.bold.bgCyanBright;
// const headingColor = clc.black.bold.bgYellowBright;
// const oopsColor = clc.black.bold.bgRedBright;
// const passedColor = clc.black.bold.bgGreenBright;
// const passedColor2 = clc.green.bold.bgYellow;
// const tokenColor = clc.green;
// const offerColor = clc.yellow;
// const connectionColor = '#FF00FF';
// const lookAtMeColor = clc.white.bgRed;
// const todoColor = clc.black.bgWhite;
// const auditColor = clc.yellow;

function connectionColor(message, data) {
  console.log(`%c${message}`, data, clc.connectionColor);
}
function headingColor(message) {
  console.log(`%c${message}`, clc.headingColor);
}
function lookAtMeColor(message) {
  console.log(`%c${message}`, clc.lookAtMeColor);
}
function oopsColor(message) {
  console.log(`%c${message}`, clc.oopsColor);
}
function url(message) {
  console.log(`%c${message}`, clc.url);
}
function passedColor(message) {
  console.log(`%c${message}`, clc.passedColor);
}
function offerColor(message) {
  console.log(`%c${message}`, clc.yellow);
}
function infoColor(message) {
  console.log(`%c${message}`, clc.infoColor);
}
function auditColor(k, v) {
  console.log(
    `%c${k}
${v}`,
    clc.yellow
  );
}

//#region Internals
const promisify =
  (func) =>
  (...args) =>
    new Promise((resolve, reject) =>
      func(...args, (err, result) => (err ? reject(err) : resolve(result)))
    );

function safeParseJSON(json, fallback = null) {
  if (!json) {
    return {};
  }
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('Error parsing JSON:', error, 'Input:', json);
    return fallback;
  }
}

const isValidJSON = (str) => {
  try {
    safeParseJSON(str);
    return true;
  } catch (e) {
    return false;
  }
};
const isValidJSON2 = (str) => {
  try {
    return safeParseJSON(str);
  } catch (e) {
    return false;
  }
};

//#endregion
const unmapMe = (map) => {
  if (map.size === 0) {
    return;
  }
  const value = {};
  for (const [k, v] of map) {
    if (v.size) {
      const m = map.get(k);
      value[k] = [...m];
    } else {
      value[k] = v;
    }
  }
  return value;
};

const remapMe = (obj) => new Map(Object.entries(obj));

const mapData = (data) => {
  //const data = Object.entries(redisData)[1][1][1];

  const map = data
    .filter((v) => v.at(-1))
    .map((v) => {
      return {
        key: v[0],
        type: v[1].type ? v[1].type[0] : null,
        value: v.at(-1),
      };
    });
  clj(map);
  console.log();
};

const printResults = (msg, result) => {
  collapsedLog({ heading: msg, arg: result });
};

const reduceMap = (map) =>
  map.reduce((a, c) => {
    const key = c[0];
    const value = c[1][0];
    a.push(key, !Array.isArray(value) ? value : value[1]);
    return a;
  }, []);
/** Use this Map/Reduce everywhere
 * It takes a map and reduces it to an array of arrays.
 * @param map - The map to be collapsed/expanded.
 * @param msg - The message to display in the console.
 * @returns The mapArray.
 */
const showMap = (map, msg) => {
  const mapArray = reduceMap(map);
  log(msg);
  table(mapArray);
  return mapArray;
};

//#endregion Helpers
const trace = (promise, msg = 'Trace results :>>') => {
  collapsedLog({ heading: msg, arg: promise });

  return promise;
};

const binaryHas = (score, val) => (score & val) === val;

function error(e) {
  // console.error(clc.red.bold(e));
  console.error(e);
}
function endSuccess(msg) {
  // console.log(clc.bgGreen.black(msg));
  console.log(msg);
}

const head = (val) => (Array.isArray(val) && !isEmpty(val) ? val[0] : '');
const tail = (val) => (Array.isArray(val) && !isEmpty(val) ? val.at(-1) : '');

function info(msg) {
  console.info(msg);
}

const isEmpty = (val) => {
  if (val instanceof Map) {
    return val.size === 0;
  }
  const isEmpty =
    val === undefined ||
    val == null ||
    val == '' ||
    !(Object.keys(val) || val).length;
  return isEmpty;
};

// function jLog(json, msg = 'json >>:', color = clc.white) {
function jLog(json, msg = 'json >>:') {
  if (isEmpty(json)) {
    return '';
  }
  const data =
    typeof json[0] === 'function' ? `` : JSON.stringify(json, null, 2);

  const output = `${msg} ${data}`;
  console.log(output);
  return output;
}

function notice(msg) {
  console.log(` ${msg}`);
}
// function notice(msg, color = clc.yellow) {
//   console.log(color(` ${msg}`));
// }
const reducePairsToObject = (arrayOfPairs) =>
  arrayOfPairs.reduce((a, c, i) => {
    if (i % 2 === 0) {
      a[c] = isValidJSON(arrayOfPairs[i + 1])
        ? safeParseJSON(arrayOfPairs[i + 1])
        : arrayOfPairs[i + 1];
    }
    return a;
  }, {});

function sumArray(arr, prop, fnc = (v) => (v > 0 ? v : 0)) {
  if (isEmpty(arr)) {
    return 0;
  }
  return arr.reduce((a, c) => {
    const tokens = Number(c[prop]);
    a += fnc(tokens);
    return a;
  }, 0);
}

function success(msg) {
  // console.log(clc.green(msg));
  console.log(msg);
}
function warn(msg) {
  // console.warn(clc.yellow(msg));
  console.warn(msg);
}

const compose = (...fns) =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        f(g(...args))
  );
const collapsedLog = ({ heading, arg, open = false }) => {
  // TODO Once msft fixes the frozen debug console issue, uncomment below
  // const f = open ? console.log : console.log;
  // f(heading);
  console.log(open ? ' ' : '');

  notice(`${heading}:`);
  if (Array.isArray(arg)) {
    arg.forEach((row) => {
      console.table(row);
    });
  } else {
    console.warn(`   ${printJson(arg)}`);
  }
  console.log(' ');
};

/**
 * Try to construct a table with the columns of the properties of
 * `tabularData`(or use `properties`) and rows of `tabularData` and log it.
 * Falls back to just logging the argument if it can’t be parsed as tabular.
 *
 * ```js
 * // These can't be parsed as tabular data
 * console.table(Symbol());
 * // Symbol()
 *
 * console.table(undefined);
 * // undefined
 *
 * console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }]);
 * // ┌─────────┬─────┬─────┐
 * // │ (index) │  a  │  b  │
 * // ├─────────┼─────┼─────┤
 * // │    0    │  1  │ 'Y' │
 * // │    1    │ 'Z' │  2  │
 * // └─────────┴─────┴─────┘
 *
 * console.table([{ a: 1, b: 'Y' }, { a: 'Z', b: 2 }], ['a']);
 * // ┌─────────┬─────┐
 * // │ (index) │  a  │
 * // ├─────────┼─────┤
 * // │    0    │  1  │
 * // │    1    │ 'Z' │
 * // └─────────┴─────┘
 * ```
 */
function table(heading, data) {
  // console.log(headingColor(heading));
  console.log(heading);
  const { intent, context } = data[0];
  console.table([{ intent }, { ...context.key }, { ...context.value }]);
  console.table(data);
}

const safeAck = (ack, data, source) => {
  if (source) {
    // collapsedLog({ heading: `safeAck(): ${source}`, arg: data, open: true });
  }
  if (ack && typeof ack === 'function') {
    jl('index.safeAck() return ', data);
    ack(data);
    // TODO we used to return here and when safeAck is called. do we need the return
    // need to return data for addStream in index.js
    return data;
  }
};

function userAgent() {
  // doew browser support new navigator.userAgentData?
  const hasUserAgentData = navigator.userAgentData;
  if (!hasUserAgentData) {
    return 'Firefox';
  }
  const hasBrands = navigator.userAgentData.brands;
  const hasLastBrand = hasBrands.at(-1);
  const brand = hasLastBrand?.brand ?? 'Chrome2';
  console.log('navigator.userAgentData :>> ', navigator.userAgentData);
  console.log('brand :>> ', brand);
  return brand;
}
const printJson = (json) => {
  return JSON.stringify(json, null, 2);
};

const pj = (json) => printJson(json);
const pjm = (json) => printJson([...json]);
const pjms = (mapOfMaps) => {
  const x = Object.fromEntries(mapOfMaps);
  return JSON.stringify(x);
};

const clj = (json, msg = 'json', color = clc.blue) =>
  // const clj = (json, msg = 'json') =>
  {
    console.log(msg, pj(json), color);
    // console.log(msg, pj(json));
  };

const clm = (json) => console.log(pjm(json));
const clms = (mapOfMaps) => {
  for (const [k, v] of mapOfMaps) {
    console.log(k);
    if (v.size) {
      clm(v);
    } else {
      console.log(v);
    }
  }
};

const printByType = (color, heading, data, note) => {
  console.log(
    clc[color](`${heading}
  ${pj(data)}
  NOTE: ${note ? note : 'no comment'}`)
  );
};

const emitFromClient = (client, eventName, data, targetName, ack) => {
  client.emit(eventName, data, targetName, ack);
};

const emitFromClient2 = (client, role, data, ack, caller) => {
  if (!caller) {
    // debugger
    caller = 'UNSPECIFIED';
  }
  // if (!client) {
  //   debugger;
  // }
  jl(`helpers.js ${caller}.emitFromClient2():`, data);
  client.emit(role, data, ack);
};

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
const urlBuilder = ({
  route,
  search,
  origin = new URL(window.location.origin),
}) => {
  // only use route elements with a value
  try {
    const url = new URL(route.filter((v) => v).join('/'), origin);
    // only use searchParams with a value
    search.forEach(([key, val]) => {
      url.searchParams.set(key, val);
    });
    return url;
  } catch (error) {
    const e = `${error}
    origin: ${origin}`;
    alert(e);
  }
};

let debugLog = [];

function logDebugLog(title, data) {
  const entry = { entry: { title, data } };
  console.log('Entering:', title);

  debugLog.push(entry);
  console.log(JSON.stringify(debugLog, null, 2));
}

function dateFromID(id, withTime = true) {
  if (!id) {
    return '';
  }
  return new Date(Number(id.slice(0, 13)))
    .toString()
    .slice(4, withTime ? 21 : 16);
}

function dateFromTimestamp(ts) {
  return new Date(Number(ts));
}

function myDate() {
  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1; // Month is zero-based, so we add 1
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const ms = date.getMilliseconds();

  // Create a formatted date string in the format "DD/MM/YYYY HH:MM:SS"
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${ms}`;
}

function random(start, stop) {
  // Generate a random number between start (inclusive) and stop (exclusive)
  // For example, random entry in array with 0 and array.length
  return Math.round(Math.random() * (stop - start) + start);
}

function isTrueOrFalse(string) {
  const x =
    string === 'true'
      ? true
      : string === 'false'
      ? false
      : new Error('Neither true nor false');
  console.log(x);
  return x;
}

const rules = {
  email: (value) => {
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return !value || pattern.test(value) || 'Invalid e-mail.';
  },
  scheme: (value) =>
    value === 'http' || value === 'https' || 'use only https or http',
  domain: (value) => value.includes('.') || 'where is your period?',
  root: (value) => value.startsWith('/') || 'start with a /',
  positive: (value) => value > 0 || 'Positive number only.',
  greaterThanMin: (value) =>
    parseInt(value) >= parseInt(this.editedEvent.tokens) ||
    `Maximum (${parseInt(value)}) cannot be less than minimum (${parseInt(
      this.editedEvent.tokens
    )}).`,
  required: (value) => !!value || 'Required.',
  counter: (value) => value.length <= 10 || 'Max 10 characters',
  url: (value) => {
    const pattern =
      /^https?:\/\/?(www\.)?[a-z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b[-a-z0-9@:%_+~#()?&/=]*/gi;
    const result = pattern.test(value);
    if (value) {
      return result
        ? result
        : 'Invalid url. Keep adding (or check against) required data.';
    }
    return true;
  },
  acceptedCharacters: (value) =>
    !/[\/#&:]/.test(value) || 'use only @ to separate name values', // eslint-disable-line
};

function parseBooleanString(value) {
  return value === 'true';
}
const intersection = (a, b) => {
  const s = new Set(b);
  return a.filter((x) => s.has(x));
};

function convert(obj) {
  return safeParseJSON(
    JSON.stringify(obj, (key, value) => {
      if (key === 'isOrg' || key === 'isVid') {
        return value === 'true';
      }
      return value;
    })
  );
}

function cl(k, v, color) {
  color(`${k}\n${v}`);
  return;
}
// function cl(k, v, color = clc.cyan) {
//   console.log(k, ` :>> `, v, color);
//   return;
// }

function cw(k, v) {
  console.warn(k, ` :>> `, v);
}

function ce(k, v) {
  console.error(k, ` :>> `, v);
}

function isJSON(property) {
  return typeof property === 'object' && property !== null;
}

function log(key, value) {
  const v = isJSON(value) ? pj(value) : value;

  console.log(key, ' :>> ', v);
}

function Audit(k, v) {
  auditColor(k, v);
  console.log(' ');
}

function jl3(k, value) {
  jl(k, value, 3);
}

function jl(k, value, level = 0, color = infoColor) {
  // function jl(k, value, level = 0) {
  const getValue = isJSON(value) ? pj(value) : value;
  const v = !value ? 'NA' : getValue;
  const useColor = !value ? auditColor : color;
  const match = {
    0: () => cl(k, v, useColor),
    1: () => cw(k, v),
    2: () => ce(k, v),
    3: () => Audit(k, v),
  };
  if (match[level]) {
    return match[level]();
  }
}

const predicates = {
  isVid: (item) => {
    return item.isVid ? [item.id, item] : null;
  },
  isOrg: (item) => {
    return item.isOrg && predicates.isVid(item) ? [item.id, item] : null;
  },
  all: (item) => {
    return [item.id, item];
  },
  ids: (item) => item.id,
};

// for some reason, Chatty's function isIterable() works in a scratch.js file, but not here:
// TypeError: object is not iterable (cannot read property Symbol(Symbol.iterator))
function isIterable(obj) {
  return obj != null && typeof obj[Symbol.iterator] === 'function';
}

// function logMap2(map, level = 0, color = clc.blue, msg = '') {
function logMap2(map, level = 0, msg = '') {
  if (map.size === 0) {
    console.warn('No map object available');
    return;
  }

  if (map instanceof Map || isIterable(map)) {
    // jl(msg, convertMapToArray(map), level, color);
    jl(msg, convertMapToArray(map), level);
  } else {
    console.error(`Argument Error: Expected an Array. Got ${typeof map}`);
    console.error('map: ', map);
  }
}
function convertMapToArray(map) {
  // TODO workaound for odd isIterable()
  try {
    // return [...map].reduce((result, [key, value]) => {
    return Array.from(map).reduce((result, [key, value]) => {
      if (value instanceof Map) {
        result.push([key, convertMapToArray(value)]);
      } else {
        result.push([key, value]);
      }
      return result;
    }, []);
  } catch (error) {
    console.error('Could not reduce map as Map');
    return [];
  }
}

//#region AEgis-Tqr Interactions
function redisStreamToMap(redisData, fnc = predicates.all) {
  console.log('redisStreamToMap()----------------------');
  const redisMap = new Map();
  const data = convert(tail(redisData));
  jl('redisStreamToMap().data', data);
  const goodData = data.filter(
    (v) =>
      !data
        .filter((v) => v.isDeleted)
        .map((v) => v.id)
        .includes(v.id)
  );
  jl('redisStreamToMap().goodData', goodData);

  // Map() will not accept nulls
  const mappable = goodData.map(fnc).filter(Boolean);
  jl('redisStreamToMap().mappable', mappable);
  console.log('----------------------------');

  redisMap.set(head(redisData), new Map(mappable));
  return redisMap;
}

function tensorMapJoin(client, preamble, owner, tensor) {
  console.warn('audit tensorMapJoin() getting Tensors for :>> ', owner);

  const key = {
    preamble,
    owner,
  };
  const value = tensor;
  const context = {
    crd: 'tensorMapJoin',
    context: { key, value },
  };
  const role = 'contacts';
  const caller = 'helpers.tensorMapJoin()';
  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (join) => resolve(join), caller);
  });
}

function getVidLabel(client, key) {
  console.warn('audit getVidLabel() for VID :>> ', key);
  console.log();
  const context = {
    crd: 'getVidLabel',
    context: { key },
  };
  const role = 'contacts';

  const caller = 'helpers.getVidLabel()';
  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (join) => resolve(join), caller);
  });
}

function getTensorVids(client, preamble, owner) {
  const key = {
    preamble: `${preamble}:links`,
    owner,
  };
  console.log();
  const context = {
    crd: 'getTensorVids',
    context: { key },
  };
  const role = 'contacts';

  console.warn(`audit getTensorVids() for LINK :>> ${preamble}:${owner}`);
  const caller = 'helpers.getTensorVids()';
  return new Promise((resolve) => {
    emitFromClient2(
      client,
      role,
      context,
      (vectors) => {
        const result = { owner, vectors };
        jl('getTensorVids() result', result);
        resolve(result);
      },
      caller
    );
  });
}

function getVidTensors(client, preamble, owner) {
  const key = {
    preamble: `${preamble}:links`,
    owner,
  };
  console.log();
  const context = {
    crd: 'getVidTensors',
    context: { key },
  };
  const role = 'contacts';

  console.warn(`audit getVidTensors() for LINK :>> ${preamble}:${owner}`);
  const caller = 'helpers.getVidTensors()';
  return new Promise((resolve) => {
    emitFromClient2(
      client,
      role,
      context,
      (vectors) => {
        const result = { owner, vectors };
        jl('getVidTensors() result', result);
        resolve(result);
      },
      caller
    );
  });
}

function linkVcardToTensor(client, preamble, id, tensorID) {
  const key = {
    preamble: preamble,
    owner: id,
  };
  const value = tensorID;
  const context = {
    crd: 'link',
    context: { key, value },
  };
  const role = 'contacts';

  console.warn('audit linkVcardToTensor() for key :>> ', key);
  const caller = 'helpers.linkVcardToTensor()';
  return new Promise((resolve) => {
    emitFromClient2(
      client,
      role,
      context,
      (data) => {
        if (data) {
          console.log('data: :>>', pj(data));
          resolve(data);
        }
      },
      caller
    );
  });
}

function exists(client, preamble, id) {
  const key = {
    preamble,
    owner: id,
  };
  const context = {
    crd: 'exists',
    context: { key },
  };
  const role = 'contacts';

  console.warn('audit exists() for key :>> ', key);
  const caller = 'helpers.exists';
  return new Promise((resolve) => {
    emitFromClient2(
      client,
      role,
      context,
      (exists) => {
        console.log('exists: :>>', pj(exists));
        resolve(exists);
      },
      caller
    );
  });
}

function getJson(client, preamble, id, subkey = '') {
  if (!id) {
    alert('getJson() needs an id arg for ' + subkey);
    return;
  }
  // const preamble = `${preamble}:${!subkey ? 'profiles' : subkey}`;
  const key = {
    preamble,
    owner: id,
  };
  const context = {
    crd: 'getJson',
    context: { key },
  };
  const role = 'contacts';

  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (data) => {
      resolve({ pid: context.context.key.owner, displayName: data[1][0][3] });
    });
  });
}
function setJson(client, preamble, id) {
  const key = {
    preamble,
    owner: id,
  };
  const context = {
    crd: 'setJson',
    context: { key },
  };
  const role = 'contacts';

  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (data) => {
      resolve({ pid: context.context.key.owner, displayName: data[1][0][3] });
    });
  });
}

function audit(client, suffix, data, ttlm = 5) {
  const preamble = 'audit:tensor';

  const key = `${preamble}:${suffix}`;
  const value = { value: data, ttlm };
  const context = {
    crd: 'audit',
    context: { key, value },
  };
  const role = 'contacts';

  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (result) => {
      resolve(result);
    });
  });
}

function filterStreamByField(client, preamble, id, fieldName, fieldValue) {
  const key = {
    preamble: preamble,
    owner: id,
  };
  const value = { fieldName, fieldValue };
  const context = {
    crd: 'filterStreamByField',
    context: { key, value },
  };

  const role = 'contacts';
  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (data) => {
      if (data) {
        console.log('data: :>>', pj(data));
        resolve(data);
      }
    });
  });
}
function captureError(client, err, vm, info, context) {
  console.error('Component Error:', err);
  console.error('Vue instance:', vm);
  console.error('Error info:', info);

  const stackLines = err.stack.split('\n').slice(0, 2);
  const [cause, func] = stackLines;
  const payload = { context, cause, func };
  jl3('payload', payload);
  return audit(client, 'errors', payload).then((id) => {
    console.log('leaving audit()');
    return getThisStreamRecord(client, 'audit:tensor:errors', id).then(
      (summary) => {
        jl('summary', summary);
        const oopsArray = [
          `${summary.title} recorded for the devs.`,
          `Log ID: ${id}`,
        ];
        return oopsArray;
      }
    );
  });
}

function getThisStreamRecord(client, preamble, id) {
  const key = preamble;
  const value = id;
  const context = {
    crd: 'getThisStreamRecord',
    context: { key, value },
  };

  const role = 'contacts';
  return new Promise((resolve) => {
    emitFromClient2(client, role, context, (data) => {
      if (data) {
        console.log('data: :>>', pj(data));
        resolve(data);
      }
    });
  });
}



//#endregion

const INTERVAL = {
  NOW: 'now',
  DAY: 'day',
};
// const CRDs = {
//   create: 'create',
//   read: 'read',
//   delete: 'delete',
//   first: 'first',
//   last: 'last',
//   scan: 'scan',
// };

function getTopicOrderKey(spaceId){
  if (!spaceId) {
    throw new Error('Space ID is required to generate the topic order key.')
  }
  return `space:${spaceId}:topicOrder`
}

export  {
  getTopicOrderKey,
  binaryHas,
  compose,
  clc,
  emitFromClient,
  emitFromClient2,
  endSuccess,
  error,
  head,
  info,
  isEmpty,
  jLog,
  log,
  notice,
  pj,
  pjm,
  pjms,
  clj, // console.log(pj(json))
  clm, // console.log(pjm(json))
  clms, // mapOfMaps
  printResults,
  success,
  tail,
  warn,

  reducePairsToObject,
  safeAck,
  showMap,
  table,
  trace,

  promisify,
  printByType,
  printJson,
  isValidJSON2,

  sumArray,
  collapsedLog,
  userAgent,

  urlBuilder,
  logDebugLog,

  unmapMe,
  remapMe,
  mapData,

  myDate,
  random,
  isTrueOrFalse,

  // enums
  INTERVAL,
  // CRDs, // TODO Where do we dereference this? it should only come from constants.js.

  // colors
  headingColor,
  oopsColor,
  url,
  // tokenColor,
  offerColor,
  connectionColor,
  passedColor,
  // passedColor2,
  lookAtMeColor,
  // urlColor,
  // todoColor,
  auditColor,

  rules,
  dateFromID,
  dateFromTimestamp,
  parseBooleanString,
  convert,
  isJSON,
  jl,
  jl3,
  redisStreamToMap,
  predicates,
  logMap2,
  convertMapToArray,
  tensorMapJoin,
  linkVcardToTensor,
  getVidLabel,
  getTensorVids,
  getVidTensors,
  filterStreamByField,
  getThisStreamRecord,
  captureError,
  exists,
  intersection,
  audit,
  Audit,
  getJson,
  setJson,

};

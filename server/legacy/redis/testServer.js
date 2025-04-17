//#region Intents
/*
We group intents by Portal, Producer, and Consumer.

Portal users intend to

use AEgis to:
1) List all connections  (TQR Staff only)
2) List only connections a Producer owns
    a) only connections created by their pk
    b) delegated connnections (where the connection has an id property)

use Tokens to list:
Portal
1)  all tokens processed by selected Producer
Consumer
2) all tokens earned by Consumers for selected Producer



*/

const { execute } = require('../AEgisTqr');
const {
  CRDs,
  INTENT,
  CONTEXT,
  producer,
  consumer,
  pid,
  cid,
  TARGETS,
  TARGET_NAMES,
} = require('./testConstants');

const { headingColor, pj } = require('../utils/helpers');

const regexOwner = /(\d{13}(\-\d+)*)/; // eslint-disable-line
const regexNonce = /(tqr:\S{2}:)([\w*@\w*]*)/gi; // eslint-disable-line

// called by REDIS below for direct testing purposes
function run({ crd, context }) {
  console.log(headingColor('Step 3: testServer.run'));
  console.log(`testServer.run(
  ${crd}
  ${pj(context)})`);

  return execute({ crd, context }).catch((err) =>
    console.error(`!!!!!!!  ${err}  !!!!!!!!`)
  );
}

// called in TESTS region below to ensure clientCall() and run()
// return the same data.
// mainly, called by index.js to run the same code as test runs do
// (so app can never be out of spec (at least as far as functions go)).
// later versions will incorporate state charts to control function calls.
const clientCall = (args) => {
  // to disambiguate the context from caller with the context in getArgs()
  // rename caller context to ctx
  const { crd, intent, context: ctx } = args;

  console.log(headingColor(`Step 1: clientCall(${intent})`));
  console.log('crd :>> ', crd);
  console.log('context :>> ', pj(ctx) ?? 'no special context necessary');

  // TODO this match has to match the match in index.js
  // and the Master Whitebox Test Plan
  // Step 4: (continued from constants.js) add INTENT matched to REDIS
  const match = {
    newUser: addStream,

    createConnection: addStream,
    createCampaign: addStream,
    readConnection: getStream,
    archiveConnection: archiveStream,
    archiveCampaign: archiveStream,

    scanConnections: scanStreams,
    scanTokens: scanStreams,
    scanEvents: scanStreams,
    scanEventTokens: scanStreams,
    archiveEvent: archiveStream,

    earnTokens: addStream,
    burnTokens: addStream,
    readTokens: getStream,

    createEvent: addStream,
    readEvent: getStream,
    readEventTokens: getStream,
    earnEventTokens: addStream,
    burnEventTokens: addStream,

    getHash: getHash,
    setHash: setHash,

    getMHash: getMHash,
    setMHash: setMHash,

    getJson: getJson,
    setJson: setJson,
  };
  if (intent) {
    return match[intent]({ crd, intent, context: ctx }).catch((err) =>
      console.log(err)
    );
  }
};

const contextMap = new Map(CONTEXT);

// because we use positional args, ctx is caller context field
const getArgs = (crd, intent, ctx) => {
  const getValue = (canonical, ctx) =>
    Array.isArray(ctx) ? [...canonical, ...ctx] : { ...canonical, ...ctx };

  console.log('getArgs().ctx:', pj(ctx));
  // End Step 1

  console.log(
    headingColor(`Step 2: testServer.getArgs() with intent: ${intent}`)
  );
  // get data from constants for intent
  // and merge with caller's context (when testing production code)
  const mergeContexts = () => {
    const canonical = contextMap.get(intent);
    console.log('canonical:', pj(canonical));
    console.log('ctx:');
    console.table([{ ...ctx.key }, { ...ctx.value }]);
    // note this is a deep merge because it goes down two levels
    const key = { ...canonical.key, ...ctx.key };
    const value = getValue(canonical.value, ctx.value);
    return { key, value };
  };

  const context = ctx ? mergeContexts() : contextMap.get(intent);

  console.log('getArgs().context (merged with ctx) :>> ');
  console.table([{ ...context.key }, { ...context.value }]);

  console.log(' ');
  return { crd, context };
};

const getStreamData = (intent, context, keys) => {
  // hash can be singular (e.g., connections) or compound (e.g., *:tokens)
  // compound hashes need to replace * with eventname
  // but subsequent keys have differenct eventNames
  const getHash = (eventName) => {
    if (context.key.hash.startsWith('*')) {
      return context.key.hash.replace('*', eventName);
    } else if (context.key.hash.includes(':')) {
      const hash = context.key.hash.split(':')[1];
      return `${eventName}:${hash}`;
    }
    return context.key.hash;
  };

  return keys.map((key) => {
    {
      const keyParts = key.split(':');
      const owner = keyParts[2];
      const id = keyParts.at(-1);
      context.key.owner = owner;

      const eventName = keyParts.at(3);
      context.key.hash = getHash(eventName);

      context.key.id = id;
      console.log('context :>> ', pj(context));
      // TODO had trouble with Transform() with revrange
      // return getLast({ intent, context });
      return getStream({ intent, context });
    }
  });
};

//#region TestCode
const scanStreams = ({ intent, context }) =>
  run(getArgs(CRDs.scan, intent, context))
    .then((keys) => {
      return keys;
    })
    .then((keys) => {
      const x = getStreamData(intent, context, keys);
      return Promise.all(x).then((d) => {
        const data = d.filter((v) => v);
        console.log('testServer.scanStreams().getStreamData() result :>');
        console.log('data', pj(data));

        return data;
      });
    });

// .then((ok) => logAllStreams(intent, ok));

// for Rewards View where View html saved in Redis hash
const getHash = ({ intent, context }) =>
  run(getArgs(CRDs.getHash, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );
const setHash = ({ intent, context }) =>
  run(getArgs(CRDs.setHash, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );
const getMHash = ({ intent, context }) =>
  run(getArgs(CRDs.getMHash, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );
const setMHash = ({ intent, context }) =>
  run(getArgs(CRDs.setMHash, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );
const getJson = ({ intent, context }) =>
  run(getArgs(CRDs.getJson, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );
const setJson = ({ intent, context }) =>
  run(getArgs(CRDs.setJson, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );

const addStream = ({ intent, context }) =>
  run(getArgs(CRDs.create, intent, context)).then((ok) =>
    logResults(intent, Array.isArray(ok) ? ok.flat() : ok)
  );

const getStream = ({ intent, context }) =>
  run(getArgs(CRDs.read, intent, context));
// .then((ok) =>
// TODO use the new redis rewards and campaigns components
//logResults(intent, ok.flat(), context?.id)
// );

const archiveStream = ({ intent, context }) =>
  run(getArgs(CRDs.archive, intent, context));
const restore = ({ intent, context }) =>
  run(getArgs(CRDs.restore, intent, context));

const getFirst = ({ intent, context }) =>
  run(getArgs(CRDs.first, intent, context));
const getLast = ({ intent, context }) =>
  run(getArgs(CRDs.last, intent, context));
//#endregion TestCode

const REDIS = {
  getStream,
  scanStreams,

  addStream,

  getHash,
  setHash,

  getJson,
  setJson,

  //#region Not implenmented until Beta2.2
  getFirst,
  getLast,

  archiveStream,
  restore,
  //#endregion
};

//#region Render test results
const getStreamsFor = (data, id) => {
  return data.reduce((a, c, i, arr) => {
    if (typeof c === 'string' && c.includes(id)) {
      a.push({ key: c, val: arr[i + 1] });
    }
    return a;
  }, []);
};

const logResults = (hash, ok, id) => {
  const getData = () => {
    const key = ok[0];
    const data = id ? getStreamsFor(ok, id) : ok[1];

    console.log(headingColor(`Final Step: ${hash} result for key = ${key} `));
    console.log(pj(data));
  };
  const showArray = () => {
    console.log(headingColor(`Final result for ${hash}: ${ok} `));
  };

  Array.isArray(ok) ? getData() : showArray();

  return ok;
};

//#endregion Render test results

module.exports = {
  clientCall,
  CRDs,
  INTENT,
  REDIS,

  headingColor,
  producer,
  consumer,
  pid,
  cid,

  TARGETS,
  TARGET_NAMES,
};

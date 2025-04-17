//#region CONSTANTS

const players = {
  // NOTE: if nonce or pid is missing in data from TQROnline,
  // Redis will have data with 'x' in the stream keys,
  // and we will be able to quickly identify and fix the discrepancy .
  // The other default values below should be acceptable absent
  // any overriding date from client.
  producer: {
    nonce: 'oops',
    id: '1234567890123-0',
    event: 'If you see this Event, you messed up.',
  },
  consumer: {
    nonce: 'interloper',
    id: '1234567890123-1',
  },
};

const consumer = players.consumer;
const producer = players.producer;
const pid = producer.id;
const cid = consumer.id;

const APPROVAL = {
  AUTO: 'auto',
  MANUAL: 'manual',
  CAMPAIGN: 'Campaign',
  INTERVAL: {
    NOW: 'now',
    DAY: 'day',
  },
};

const CRDs = {
  create: 'create',
  earn: 'earn',
  burn: 'burn',
  read: 'read',
  delete: 'delete',
  first: 'first',
  last: 'last',
  scan: 'scan',
  archive: 'archive',
  restore: 'restore',

  set: 'set',
  get: 'get',
  setM: 'setM',
  getM: 'getM',

  setHash: 'setHash',
  getHash: 'getHash',

  setMHash: 'setMHash',
  getMHash: 'getMHash',

  setJson: 'setJson',
  getJson: 'getJson',
};

// Step 1: add an INTENT
const INTENT = {
  newUser: 'newUser',
  createConnection: 'createConnection',
  createCampaign: 'createCampaign',
  archiveCampaign: 'archiveCampaign',
  readConnection: 'readConnection',
  scanConnections: 'scanConnections',

  scanTokens: 'scanTokens',
  scanEvents: 'scanEvents',
  scanEventTokens: 'scanEventTokens',

  earnTokens: 'earnTokens',
  burnTokens: 'burnTokens',
  readTokens: 'readTokens',

  createEvent: 'createEvent',
  readEvent: 'readEvent',
  readEventTokens: 'readEventTokens',
  earnEventTokens: 'earnEventTokens',
  burnEventTokens: 'burnEventTokens',

  tokenRequest: 'tokenRequest', // half-duplex event for manual override

  getHash: 'getHash',
  setHash: 'setHash',
  getJson: 'getJson',
  setJson: 'setJson',
};

// Step 2: Add default CONTEXT
const CONTEXT = [
  // NOTE: Be sure you have corresponding entries below for
  // CONTEXT, INTENT, and TEST.
  // And in testRunner.js the INTENT is listed in the runner object,
  // and the match object maps to a primitive function.
  // Always include a value object (even if it's empty).
  //#region CREATE
  [
    'newUser',
    {
      key: { preamble: 'tqr:pks' },
      value: {
        socketID: 'TBD',
      },
    },
  ],
  [
    'getHash',
    {
      key: { preamble: 'tqr:xx' },
      value: { hashData: 'MISSSING' },
    },
  ],
  [
    'setHash',
    {
      key: { preamble: 'tqr:xx' },
      value: { hashData: 'MISSSING' },
    },
  ],
  [
    'getMHash',
    {
      key: { preamble: 'tqr:xx' },
      value: [],
    },
  ],
  [
    'setMHash',
    {
      key: { preamble: 'tqr:xx' },
      value: {},
    },
  ],
  [
    'getJson',
    {
      key: { preamble: 'tqr:xx' },
      value: {},
    },
  ],
  [
    'setJson',
    {
      key: { preamble: 'tqr:xx' },
      value: { json: 'missing' },
    },
  ],
  [
    'createConnection',
    {
      key: {
        preamble: 'tqr:xx',
        owner: pid,
        hash: 'connections',
        id: players.producer.nonce,
      },
      value: {
        burnType: APPROVAL.AUTO,
        tokenMin: 1,

        modulus: 0,
      },
    },
  ],
  [
    'createCampaign',
    {
      key: {
        key: {
          preamble: 'tqr:xx',
          owner: pid,
          hash: 'connections',
          id: players.producer.nonce,
        },
      },
      value: {
        burnType: APPROVAL.CAMPAIGN,
      },
    },
  ],
  [
    'earnTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce, //chrome
        hash: 'tokens',
        id: cid,
      },

      value: {
        nonce: players.producer.nonce,
        tokens: 10,
      },
    },
  ],
  [
    'burnTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'tokens',
        id: cid,
      },

      value: {
        tokens: -5,
      },
    },
  ],

  // earn eventTokens
  // tqr:lo:mpc@promo@noRedir:event:Test Event:12345-0
  [
    'earnEventTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce, //chrome
        hash: `${players.producer.event}:tokens`,
        id: cid, //675
      },

      value: {
        eventName: players.producer.event,
        nonce: players.producer.nonce, //220
        tokens: 2,
        redirect: '',
      },
    },
  ],
  [
    'burnEventTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: `${players.producer.event}:tokens`,
        id: cid, //675
      },

      value: {
        eventName: players.producer.event,
        nonce: players.producer.nonce,
        tokens: -2,
        burnUrl: '',
      },
    },
  ],

  /*
  tqr:lo:chrome@220@CleanupSisters:event:Downtown
  {"tokens":"1","start":"1662508800000","end":"1662508800000","burnUrl":"https://tqrtoken.com/tqr-token-competency/?CID=123456789012-0&Campaign=DemoCamp&t=12}
  */
  [
    'createEvent',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'events',
        id: players.producer.event,
      },

      value: {
        tokens: 2,

      },
    },
  ],
  //#endregion CREATE

  //#region READ
  [
    'scanConnections',
    {
      key: {
        preamble: 'tqr:xx*',
        owner: '*', //override in testServer and testRunner, as necessary
        hash: 'connections',
        id: '*',
      },
      value: {},
    },
  ],
  [
    'scanTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: '*', //players.producer.nonce,
        hash: 'tokens',
        id: cid,
      },
      value: {},
    },
  ],
  [
    'scanEventTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: '*:tokens',
        id: cid,
      },
      value: {},
    },
  ],

  // tqr:lo:chrome@220@CleanupSisters:event:Downtown
  [
    'scanEvents',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'events',
        id: players.producer.event,
      },
      value: {},
    },
  ],

  [
    'readConnection',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'connections',
        id: cid,
      },
      value: {
        start: '-',
        end: '+',
      },
    },
  ],
  [
    'readTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'tokens',
        id: cid,
      },
      value: {
        start: '-',
        end: '+',
      },
    },
  ],
  [
    'readEventTokens',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'tokens',
        id: cid,
      },
      value: {
        start: '-',
        end: '+',
      },
    },
  ],
  [
    'readEvent',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'events',
        id: 'A Ficticious Event',
      },
      value: {
        start: '-',
        end: '+',
      },
    },
  ],
   //#endregion READ

  //#region ARCHIVE/RESTORE
  [
    'archiveConnection',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'connections',
        id: 'mistakeInProduction',
      },
      value: {
        start: '-',
        end: '+',
        count: 1,
      },
    },
  ],
  [
    'archiveCampaign',
    {
      key: {
        preamble: 'tqr:xx',
        owner: players.producer.nonce,
        hash: 'connections',
        id: 'mistakeInProduction',
      },
      value: {
        start: '-',
        end: '+',
        count: 1,
      },
    },
  ],
  [
    'archiveEvent',
    {
      key: {
        preamble: 'tqr:XX?',
        owner: 'missing owner',
        hash: 'events',
        id: 'missing ID',
      },
      value: {
        start: '-',
        end: '+',
        count: 1,
      },
    },
  ],

  //#endregion ARCHIVE/RESTORE
];

// these TESTS must match the whitebox test plan
// Step 3: Add TESTS ref
const TESTS = {
  newUser: 'newUser',
  createConnection: 'createConnection',
  readConnection: 'readConnection',
  scanConnections: 'scanConnections',

  createCampaign: 'createCampaign',

  scanTokens: 'scanTokens',

  scanEvents: 'scanEvents',
  scanEventTokens: 'scanEventTokens',

  earnTokens: 'earnTokens',
  burnTokens: 'burnTokens',
  readTokens: 'readTokens',

  createEvent: 'createEvent',
  earnEventTokens: 'earnEventTokens',
  burnEventTokens: 'burnEventTokens',
};
//#endregion CONSTANTS
module.exports = {
  APPROVAL,
  CRDs,
  INTENT,
  CONTEXT,
  TESTS,
  producer,
  consumer,
  pid,
  cid,
};

/**
 * Functions and data here mimic or duplicate production code.
 * This means that each function below is in production code.
 * Which means that if the code below goes through the same code as unit tests
 * then production code does, as well.
 * Each function relies on ops objects with the same name: So scanConnections()
 * relies on ops.readConnection for the data that Redis needs to return the
 * intended results.
 * Global search each function to ensure production code uses the same
 * crd, intent, and context as the code here. Even use the same function names.
 *
 * For example,in Consumer.vue, we changed scanOwerData() to scanConnections().
 * We used scanConnections as the event for index.js to handle; this matches how
 * testRunner calls AEgisTqr.js, so our apis are symmetric.
 * Consumer sees all Producers, so scanConnections the context object only
 * contains the preamble field to provide Redis with the correct country in use.
 *
 * For AEgis.vue (called from Portal) we called scanConnectionForOwner
 * (which is the same function in testRunner.js) and passed in the Producer's $pk
 * in the context so the Producer sees only their own connections.
 */

const {
  clientCall,
  CRDs,
  headingColor,
  INTENT,
  REDIS,
  producer,
  consumer,
  pid,
  cid,
} = require('./testServer');

//#region Example context objects from index.js:
// Step 5: Add ops payload (use ops values in Step 6 below)
const ops = {
  newUser: {
    crd: CRDs.create,
    intent: INTENT.newUser,
    context: {
      key: {
        preamble: 'tqr:users',
      },
    },
  },
  createConnection: {
    crd: CRDs.create,
    intent: INTENT.createConnection,
  },
  createCampaign: {
    crd: CRDs.create,
    intent: INTENT.createCampaign,
  },
  scanConnections: {
    crd: CRDs.scan,
    intent: INTENT.scanConnections,
    // TODO where's context?
  },

  // scan for a particular owner
  scanOwnerConnections: {
    crd: CRDs.scan,
    intent: INTENT.scanConnections,
    context: {
      key: { preamble: `tqr:xx`, owner: pid },
    },
  },
  // scan for a particular connection
  readConnection: {
    crd: CRDs.read,
    intent: INTENT.readConnection,
    context: {
      key: {
        preamble: `tqr:xx:${pid}:connections`,
        id: producer.nonce,
      },
    },
  },

  scanEvents: {
    crd: CRDs.scan,
    intent: INTENT.scanEvents,
    context: {
      key: {
        preamble: 'tqr:xx',
        owner: producer.nonce, // GOTCHA: we assign nonce to owner and not to nonce
        hash: 'events',
        id: '*',
      },
    },
  },

  // scan for tokens earned by Consumer
  scanTokens: {
    crd: CRDs.scan,
    intent: INTENT.scanTokens,
    key: {
      context: {
        preamble: 'tqr:xx',
        id: producer.nonce,
        cid: cid,
      },
    },
  },
  scanEventTokens: {
    crd: CRDs.scan,
    intent: INTENT.scanEventTokens,
    key: {
      context: {
        preamble: 'tqr:xx',
        id: '*',
        hash: 'tokens',
      },
    },
  },
  earnTokens: {
    crd: CRDs.create,
    intent: INTENT.earnTokens,
    context: {
      key: {
        id: producer.nonce,
        cid,
        hash: 'tokens',
      },
      value: { tokens: 5 },
    },
  },
  burnTokens: {
    crd: CRDs.create,
    intent: INTENT.burnTokens,
    context: {
      key: {
        id: producer.nonce,
        cid,
        hash: 'tokens',
      },
      value: { tokens: -1 },
    },
  },
  setHtml: {
    crd: CRDs.create,
    intent: INTENT.burnTokens,
    context: {
      key: {
        id: producer.nonce,
        cid,
        hash: 'tokens',
      },
      value: { tokens: -1 },
    },
  },
  createOffer: {
    crd: CRDs.create,
    intent: INTENT.createOffer,
    context: {
      key: {
        id: producer.nonce,
        hash: 'offers',
      },
      value: {
        description: 'Start your summer right at TK',
        offerUrl: 'https://sg.tqrtoken.com',
      },
    },
  },

  // read tokens for a Producer
  readTokens: {
    crd: CRDs.read,
    intent: INTENT.readTokens,
    context: {
      key: {
        preamble: 'tqr:xx',
        id: producer.nonce,
      },
    },
  },
  archiveOffer: {
    crd: CRDs.archive,
    intent: INTENT.archiveOffer,

    context: {
      key: {
        preamble: 'tqr:xx',
        owner: producer.nonce,
        hash: 'offers',
        id: 'testOffer',
      },
      value: {},
    },
  },

  // Campaign Events
  createEvent: {
    crd: CRDs.create,
    intent: INTENT.createEvent,
    context: {
      key: {
        owner: producer.nonce,
        hash: 'events',
        id: 'A Ficticious Event',
      },
      value: {
        tokens: 1,
        start: Date.now(),
        end: 2,
        redirect: 'https://tqrtoken.com',
      },
    },
  },
  readEvent: {
    crd: CRDs.read,
    intent: INTENT.readEvent,
    context: {
      key: {
        preamble: 'tqr:xx',
        id: producer.nonce,
      },
    },
  },
  readEventTokens: {
    crd: CRDs.read,
    intent: INTENT.readEventTokens,
    context: {
      key: {
        preamble: 'tqr:xx',
        owner: producer.nonce,
        hash: 'Test Event:tokens',
        id: cid,
      },
    },
  },
  earnEventTokens: {
    crd: CRDs.create,
    intent: INTENT.earnEventTokens,
    context: {
      key: {
        owner: producer.nonce,
        hash: 'Test Event:tokens',
        id: cid,
      },
      value: { tokens: 2 },
    },
  },
  burnEventTokens: {
    crd: CRDs.create,
    intent: INTENT.burnEventTokens,
    context: {
      key: {
        owner: producer.nonce,
        cid,
        hash: 'Test Event:tokens',
        id: cid,
        burnUrl: '',
      },
      value: { tokens: -2 },
    },
  },
};
//#endregion Example context objects from index.js

//#region TestCode
// Step 6: Add test code (be sure to reference the correct ops value from Step 5 above)
const createConnection = () => {
  const op = ops.createConnection; // to get the negative tokens to add
  const intent = op.intent; //createConnection

  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({
    intent,
  });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = {
    key: {
      preamble: `tqr:xx:${cid}:connections`,
      id: `${consumer.nonce}@uhoh`,
    },
  };
  return clientCall({ crd, intent, context });
};
const /* Creating a new campaign. */
  createCampaign = () => {
    const op = ops.createCampaign; // to get the negative tokens to add
    const intent = op.intent; //createCampaign

    console.log(headingColor('RUNNING createCampaign TEST CODE'));
    REDIS.addStream({
      intent,
    });

    console.log(' ');

    console.log(
      headingColor('RUNNING SIMULATED createCampaign PRODUCTION CODE')
    );
    const crd = op.crd;
    const context = {
      key: {
        preamble: `tqr:xx:${cid}:connections`,
        id: `${consumer.nonce}@uhoh`,
      },
    };

    return clientCall({ crd, intent, context });
  };

const createEvent = () => {
  const op = ops.createEvent;
  const intent = op.intent; //createEvent
  console.log(headingColor('RUNNING createEvent TEST CODE'));
  REDIS.addStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED createEvent PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;

  //return Promise for further chaining
  return clientCall({ crd, intent, context });
};

const readConnection = () => {
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({
    intent: INTENT.readConnection,
    context: {
      key: {
        preamble: `tqr:xx:${pid}:connections`,
        id: `${producer.nonce}@uhoh`,
      },
    },
  });
  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const op = ops.readConnection;
  const crd = op.crd;
  const intent = op.intent;
  const context = op.context;
  return clientCall({ crd, intent, context });
};

const scanTokens = (owner, cid) => {
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.scanStreams({
    intent: INTENT.scanTokens,
    context: {
      key: {
        preamble: `tqr:xx`,
        owner: owner,
        id: cid,
      },
    },
  });
  console.log(' ');

  // run test code first to work out the context details...
  // e.g., produce.nonce is the owner of the stream
  //
  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const op = ops.scanTokens;
  const crd = op.crd;
  const intent = op.intent;
  const context = op.context;
  return clientCall({ crd, intent, context });
  // once clientCall() returns the same results as REDIS.scanStreams()
  // then you can set the context in production code and expect the same outcome
};

const scanEventTokens = (cid) => {
  console.log(headingColor('RUNNING scanEventTokens TEST CODE'));
  REDIS.scanStreams({
    intent: INTENT.scanEventTokens,
    context: {
      preamble: `tqr:xx`,
      owner: '*',
      hash: 'tokens',
      id: cid,
    },
  });
  console.log(' ');

  // run test code first to work out the context details...
  // e.g., produce.nonce is the owner of the stream
  //
  console.log(
    headingColor('RUNNING SIMULATED scanEventTokens PRODUCTION CODE')
  );
  const op = ops.scanEventTokens;
  const crd = op.crd;
  const intent = op.intent;
  const context = op.context;

  //return Promise for further chaining
  return clientCall({ crd, intent, context });
  // once clientCall() returns the same results as REDIS.scanStreams()
  // then you can set the context in production code and expect the same outcome
};

// TODO we need to get all connections for Consumer
// but only owner connections for producer
const scanConnections = () => {
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.scanStreams({ intent: INTENT.scanConnections });
  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const op = ops.scanConnections;
  const crd = op.crd;
  const intent = op.intent;
  const context = op.context; // usually null
  return clientCall({ crd, intent, context });
};
const earnTokens = () => {
  const op = ops.earnTokens; // to get the positive tokens to add
  const intent = op.intent;
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent, context: { pid } });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};
const burnTokens = () => {
  const op = ops.burnTokens; // to get the negative tokens to add
  const intent = op.intent; //burnTokens
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};

const earnEventTokens = () => {
  const op = ops.earnEventTokens; // to get the positive tokens to add
  const intent = op.intent;
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent, context: { pid } });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;

  //return Promise for further chaining
  return clientCall({ crd, intent, context });
};
const burnEventTokens = () => {
  const op = ops.burnEventTokens; // to get the negative tokens to add
  const intent = op.intent; //burnTokens
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};

const newUser = () => {
  const op = ops.newUser; //
  const intent = op.intent; //newUser
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};
const createOffer = () => {
  const op = ops.createOffer;
  const intent = op.intent; //createOffer
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.addStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};

const readEvents = () => {
  const op = ops.readEvents; // to get the negative tokens to add
  const intent = op.intent; //readEvents
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({ intent, context: { value: { cid } } });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const context = op.context;
  const crd = op.crd;
  return clientCall({ crd, intent, context });
};
const readEventTokens = () => {
  const op = ops.readEventTokens; // to get the negative tokens to add
  const intent = op.intent; //readEventTokens
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({ intent, context: { value: { cid } } });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const context = op.context;
  const crd = op.crd;
  return clientCall({ crd, intent, context });
};
const readTokens = () => {
  const op = ops.readTokens; // to get the negative tokens to add
  const intent = op.intent; //tokens
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({ intent, context: { value: { cid } } });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const context = op.context;
  const crd = op.crd;
  return clientCall({ crd, intent, context });
};
const scanOffers = () => {
  const op = ops.scanOffers; // to get the negative tokens to add
  const intent = op.intent; //offers
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};
const scanEvents = (cid) => {
  const op = ops.scanEvents; // to get the negative tokens to add
  const intent = op.intent; //offers
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.getStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  context.key.id = cid;
  return clientCall({ crd, intent, context });
};
const archiveOffer = () => {
  const op = ops.archiveOffer; // to get the negative tokens to add
  const intent = op.intent; //offers
  console.log(headingColor('RUNNING TEST CODE'));
  REDIS.archiveStream({ intent });

  console.log(' ');

  console.log(headingColor('RUNNING SIMULATED PRODUCTION CODE'));
  const crd = op.crd;
  const context = op.context;
  return clientCall({ crd, intent, context });
};
//#endregion TestCode

// this object contains the entire api
// it must match index.js and the Master Whitebox Test Plan
// Step 7: Add runner option
const runner = {
  newUser, //Provides a pk for Producers and Consumers
  createConnection, //Adds a connection with a pid and nonce
  scanConnections, // called by Portal to see all Proudcer connections
  // TODO readConnection not currently used by UI
  readConnection, // find one connections owned by pk (pid)

  scanTokens, //Reads all tokens granted by a given nonce to any and sll granted cids
  scanOffers, //Lists all offers for a given nonce
  scanEvents, //Lists all events for a given nonce

  createOffer, //Adds an offer for a given nonce
  archiveOffer, // marks offer by renaming stream

  earnTokens, //Adds a token with positive value for given nonce and cid
  burnTokens, //Adds a token with negative value for given nonce and cid
  readTokens, //Reads all tokens for given nonce and cid

  createCampaign, //Adds a connection with a burnType==='campaign'
  createEvent, // Adds an Event to a Campaign

  readEvents, // Read a Campaign's Events
  earnEventTokens, // Earn an Event Token during a Campaign
  burnEventTokens, // Burn Event Tokens (usually at the end of a Campaign)

  scanEventTokens, //Reads all tokens granted by a given nonce to any and sll granted cids
  readEventTokens, // Read Event Tokens for a cid
};

const suites = {
  connections: () => runner.createConnection().then(scanConnections()),
  events: () =>
    runner
      .createCampaign()
      .then(createEvent())
      .then(earnEventTokens())
      .then(scanEventTokens())
      .then(burnEventTokens())
      .then(console.log('done')),
};
console.log(suites);

// suites.connections();
runner.readEventTokens();

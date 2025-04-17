// @ts-check
//console.clear();
//#region Setup (includes all require()s)
// @ts-ignore

// so we can set NODE_ENV for the correct Redis db
require('dotenv').config();

const { clientCall, CRDs, INTENT } = require('./redis/testServer');
const { audit, redisSub } = require('./AEgisTqr');
const { safeParseJSON } = require('./redis/syntopix/helpers');

const path = require('path');

const express = require('express'); //require('https-localhost');

// @ts-ignore
const { Server } = require('socket.io');
// @ts-ignore
const { instrument } = require('@socket.io/admin-ui');

const serveStatic = require('serve-static');
const enforce = require('express-sslify');

const ImageKit = require('imagekit');

const PORT = process.env.PORT || 3333;
// const dirPath = path.join(__dirname, '../dist');
const dirPath = path.join(__dirname, 'syntopix/dist');


let editorLock = null;

const {
  connectionColor,
  head,
  headingColor,
  isEmpty,
  jl,
  jl3,
  lookAtMeColor,
  myDate,
  oopsColor,
  pj,
  safeAck,
  success,
  table,
} = require('./utils/helpers');

// todo look into this npm package to augment our Audit infrastructure
// const { unsubscribe } = require('diagnostics_channel');

function logError(err) {
  // TODO wrap any function that uses groups in a try/catch to ungroup on error
  console.error(` logError() called`);
  oopsColor(`\t` + err + '\t');
}

const os = require('os');
// const { disconnect } = require('process');

function getIpAddress() {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = '';

  // Iterate over network interfaces
  for (const key of Object.keys(networkInterfaces)) {
    const interfaceList = networkInterfaces[key];

    // Iterate over interface list
    for (const interfaceInfo of interfaceList) {
      // Check for IPv4 address and skip internal (127.0.0.1) addresses
      if (
        Object.prototype.hasOwnProperty.call(interfaceInfo, 'address') &&
        interfaceInfo.family === 'IPv4' &&
        !interfaceInfo.internal &&
        interfaceInfo.address.startsWith('192')
      ) {
        ipAddress = interfaceInfo.address;
        break;
      }
    }

    if (ipAddress) {
      break;
    }
  }

  return ipAddress;
}

const isDebugging = process.execArgv.some((arg) => arg.includes('inspect'));
const ipAddress = getIpAddress();
process.env.SERVER_IP_ADDRESS = ipAddress;

// adjust for Redis Docker in VSC
// const ip = isDebugging ? 'localhost' : ipAddress;
// const ip =
//   process.env.NODE_ENV === 'production' && !isDebugging
//     ? getIpAddress()
//     : 'localhost';
const ip = process.env.RENDER
  ? '0.0.0.0'
  : isDebugging
  ? 'localhost'
  : getIpAddress();

// const ip = '192.168.0.3';
function listen() {
  console.log('express');
  console.log('Serving static files from:', dirPath); // ⬅️ Log it

  console.log('Listening on:');
  success(`http://${ip}:${PORT}`);
  // success(`http://localhost:${PORT}`);
  console.log();
}

//#region ImageKit Code
// let imageKitKey = '';
const options = require('./config/imageKit.options');
let imageKitKey = options.privateKey;

console.log('Connecting ImageKit');
if (process.env.NODE_ENV === 'production') {
  console.log('***********************************************');
  console.log(' ');
  console.warn('Dereferencing process.env', process.env);
  imageKitKey = process.env.IMAGE_KIT_PRIVATE_KEY || imageKitKey;
  console.warn('imageKitKey', imageKitKey);
  console.log(' ');
  console.log('***********************************************');
} else {
  // const options = require('./config/imageKit.options');
  // imageKitKey = options.privateKey;
}

const imagekit = new ImageKit({
  urlEndpoint: 'https://ik.imagekit.io/tqrtoken',
  publicKey: 'public_38fn3nyEy5GZaOkqpREm6Rb2q5I=',
  privateKey: imageKitKey,
});

/* This is the express server that is listening on port 3333. */
let server;

if (process.env.NODE_ENV === 'production') {
  // enforce https on heroku
  server = express()
    .get('/test', (req, res) => {
      res.send('This is the test response');
    })
    .get('/auth', (req, res) => {
      const result = imagekit.getAuthenticationParameters();
      res.send(result);
    })
    .use(enforce.HTTPS({ trustProtoHeader: true }))
    .use(serveStatic(dirPath))
    .use('*', (_, res) => res.sendFile(`${dirPath}/index.html`))
    .listen(PORT, () => listen());
} else {
  // http://localhost works for development
  server = express()
    .get('/auth', (req, res) => {
      const result = imagekit.getAuthenticationParameters();
      res.send(result);
    })
    .use(serveStatic(dirPath))
    .use('*', (_, res) => res.sendFile(`${dirPath}/index.html`))
    .use(logError)
    .listen(PORT, () => listen());
}
// @ts-ignore
// const io = socketIO(server);
const io = new Server(server, {
  cors: {
    origin: ['https://admin.socket.io','https://tensors-lab.tqrtoken.net'],

    credentials: true,
  },
});

//#endregion

instrument(io, {
  auth: false,
  // auth: {
  //   type: 'basic',
  //   userintent: 'mcorning',
  //   password: '$2b$10$eRW.Mn7AgaJL2qBnefjiouXJj94OfGMjqMLAb3VYFuy33U3G45n8C',
  // },
});
//#endregion Setup

//#region Helpers
const printResults = (msg, result) => {
  try {
    if (result === 'a function') {
      connectionColor(result);
      return;
    }
    if (result[0]?.context) {
      connectionColor(msg);
      try {
        table('printResults()', result);
      } catch (error) {
        console.warn('result:', result);
      }
    } else {
      console.warn('Unexpected result:', result);
    }
  } catch (error) {
    if (process.connected) {
      //debugger;
    } else {
      // TODO pri2/sev1 use the audit key in Redis to track errors everywhere
      console.error(error);
    }
  }
};

let allSockets = [];

// TODO FIX: Reeval Rooms.
// here, userID is the one who added the Connection, and id is the new ConnectionID
// options will be {
//   socket,
//   userID,
// }
// const joinSocketRoom = (options) => {
//   const { socket, id } = options;
//   console.log('io.on(connection).joinSocketRoom()');
//   console.table([options]);

//   // join the "userID" room
//   // we send alerts using the userID stored in Redis stream
//   socket.join(id);
//   // used in tqrHandshake event handler
//   socket.handshake.auth.userID = id;
//   allSockets = listAllConnectedSockets();
//   console.warn('allSockets', allSockets);
//   io.emit('joined', allSockets);

//   return id;
// };
//////////////////////////////////////////////////////////////////////////////

// used then the onAddStream() context includes eventName field
// e.g., Producer handle() sends this when handling Earn token
// const over = ({ socket, eventName, context }) => {
//   const { nonce, context } =6 context;
//   const cid = context.cid;
//   const tokensGranted = context.tokens;
//   socket.to(cid).emit(eventName, { tokensGranted, nonce });
// };
//#endregion Helpers

//#region Event handlers

//#region AEgis calls

const getHash = (args) => {
  headingColor('getHash(args)');
  console.log(pj(args[0]));

  const crd = CRDs.getHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((hash) => ack(hash))
    .catch((err) => console.log(err));
};
const setHash = (args) => {
  headingColor('setHash(args)');
  console.log(pj(args[0]));

  const crd = CRDs.setHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((hash) => ack(hash))
    .catch((err) => console.log(err));
};
const getMHash = (args) => {
  headingColor('getMHash(args)');
  console.log(pj(args[0]));

  const crd = CRDs.getMHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((hash) => ack(hash))
    .catch((err) => console.log(err));
};
const setMHash = (args) => {
  headingColor('setMHash(args)');
  console.log(pj(args[0]));

  const crd = CRDs.setMHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((hash) => ack(hash))
    .catch((err) => console.log(err));
};

const getData = (args) => {
  headingColor('getData(args)');
  console.log(pj(args[0]));

  const crd = CRDs.getHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((html) => ack(html))
    .catch((err) => console.log(err));
};
const setData = (args) => {
  headingColor('setData(args)');
  console.log(pj(args[0]));

  const crd = CRDs.setHash;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((html) => ack(html))
    .catch((err) => console.log(err));
};

const getJson = (args) => {
  headingColor('getJson(args)');
  console.log(pj(args[0]));

  const crd = CRDs.getJson;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((json) => ack(json))
    .catch((err) => console.log(err));
};
const setJson = (args) => {
  headingColor('setJson(args)');
  console.log(pj(args[0]));

  const crd = CRDs.setJson;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((result) => ack(result))
    .catch((err) => console.log(err));
};

const scanStreams = (args) => {
  headingColor('scanStreams(args)');
  console.log(pj(args[0]));

  const crd = CRDs.scan;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((connections) => ack(connections))
    .catch((err) => console.log(err));
};

const archiveStream = (args) => {
  headingColor('archiveStream(args)');
  console.log(pj(args[0]));

  const crd = CRDs.archive;
  const intent = head(args).intent; //connections or tokens
  const context = head(args).context;
  const ack = args.at(-1);
  console.log('args', args);
  return clientCall({ crd, intent, context })
    .then((x) => safeAck(ack, x, 'archiveStream'))
    .catch((err) => console.log(err));
};

const getStream = (args) => {
  headingColor('getStream(args)');
  console.log(pj(args[0]));

  const crd = CRDs.read;
  const intent = head(args).intent;
  const context = head(args).context;
  const ack = args.at(-1);

  return clientCall({ crd, intent, context })
    .then((stream) => safeAck(ack, stream[1], 'ge5tream()'))
    .catch((err) => console.log(err));
};

const addStream = (args) => {
  headingColor('addStream(args)');
  console.log(pj(args[0]));

  const crd = CRDs.create;
  headingColor('addStream() args:');
  const payload = head(args);
  const { intent, context, ackEvent } = payload;
  console.table([intent, { ...context.key }, { ...context.value }, ackEvent]);

  // generally we have a id available
  // but newUser doesn't have a id (userID) yet...
  // const { id } = context.key;

  const ack = args.at(-1);

  return (
    clientCall({ crd, intent, context })
      // minimally, return the ID of the new entry
      // if you need to know how the new one affected all,
      // you need to query for all after the new entry

      // TODO safeAck() doesnt' return data...
      .then((id) => safeAck(ack, id, 'addStream()'))
      // // ...so use id, else new id
      // ...so how can feedback carry any data all?
      // .then((id) => feedback(id))

      .catch((err) => console.error(err))
  );
};

//#region half-duplex comms
const onDelegateRequest = (args, socket) => {
  const { owner, nonce, pk } = args[0];
  // handled by Delegate.vue
  socket.to(owner).emit('confirmDelegate', { nonce, pk });
};

const onSendMessage = (args, socket) => {
  // we can ignore intent because we are not interacting the Redis here, only the Producer

  const { cid, msg } = head(args);

  console.log('onSendMessage().args :>> ', cid, socket.id);
  console.table(pj([{ ...args }]));
  // socket.to(cid).emit('message', msg);
  // socket.to(socket.id).emit('message', msg);

  // send to this socket
  // socket.emit('message', msg)
  // broadcast to all connections
  io.emit('message', msg);
};

const onPatches = (args, socket) => {
  // we can ignore intent because we are not interacting the Redis here, only the Producer

  const { cid, msg } = head(args);

  console.log('onPatches().args :>> ', cid, socket.id);
  io.emit('patches', msg);
};

const onTokenRequest = (args, socket) => {
  // we can ignore intent because we are not interacting the Redis here, only the Producer
  const context = head(args).context;
  const { pid } = context.value;

  console.log('onTokenRequest().context :>> ');
  console.table([{ ...context }]);
  socket.to(pid).emit('approveTokens', context);
};

// Producer sent tokensApproved event.
// Now pass along the news to the Consumer (cid).
const onTokensApproved = (args) => {
  const { cid, tokensGranted } = args[0];
  console.log(
    headingColor(`onTokensApproved()
    cid :>>  ${cid}
    granted :>> ${tokensGranted}`)
  );
  io.to(cid).emit('tokensGranted', tokensGranted);
};
const onDeclinedTokens = (args) => {
  const { cid, transaction } = args[0];
  console.log(
    headingColor(`onDeclinedTokens()
   cid :>>  ${cid}`)
  );
  io.to(cid).emit('tokensDeclined', transaction);
};

//#endregion half-duplex comms

//#endregion AEgis calls

//#endregion Event handlers

//#region Socket.io
////////
const subTracker = new Map();

function notifyCollaborators(topicID) {
  const socketIDs = io.sockets.adapter.rooms.get(topicID);
  jl3('notifyCollaborators()  socketIDs', socketIDs);
  if (!socketIDs) {
    return;
  }
  const a = [...socketIDs];
  jl3('notifyCollaborators()  a', a);
  const collaborators = a
    .map((v) => io.sockets.sockets.get(v).handshake.auth.userID)
    .filter(Boolean);
  jl3(
    'INDEX.JS  notifyCollaborators() notifies collaborators: ',
    collaborators
  );
  io.to(topicID).emit('collaborators', collaborators);
}

const joinTopicRoom = ({ socket }) => {
  const topicID = socket.handshake.auth.topicID;
  const userID = socket.handshake.auth.userID;
  // Each topic has its own room, identified by topicID
  socket.join(topicID);
  console.log(`${userID} joined topic ${topicID}`);
  notifyCollaborators(topicID);
};

const leaveTopicRoom = (socket) => {
  const topicID = socket.handshake.auth.topicID;
  const userID = socket.handshake.auth.userID;

  socket.leave(topicID);
  console.log(`${userID} left topic ${topicID}`);
  notifyCollaborators(topicID);
};

//////////////////////////////////////////////////////////////
io.on('connection', (socket) => {
  const userID = socket.handshake.auth.userID;

  const newUser = (socketID) => {
    /* Calling the addStream function. */
    const args = [
      {
        intent: INTENT.newUser,
        context: { key: {}, value: { socketID } },
      },
      (newID) => socket.emit('newUser', newID),
    ];
    // TODO we need to email support if this invisible OBX error occurs
    addStream(args).then((id) =>
      lookAtMeColor(`Added new user to stream: ${id} `)
    );
  };

  if (!userID) {
    newUser(socket.id);
  } else {
    // we use socket's room for Topics,
    // so bring this back if necessary for other components
    // joinSocketRoom({ socket, id: userID });
  }
  socket.on('joinTopicRoom', ({ topicID, userID }) => {
    socket.handshake.auth.topicID = topicID;
    if (!topicID || !userID) {
      console.warn('Missing topicID or userID');
      return;
    }

    joinTopicRoom({ socket });
  });

  socket.on('disconnect', () => {
    if (editorLock === socket.handshake.auth.userID) {
      console.warn(
        `${socket.handshake.auth.userID} abandoned edit. releaing lock.`
      );
      editorLock = null;
    }

    const topicID = socket.handshake.auth.topicID;
    console.log(`${myDate()} user disconnected: ${socket.id}`);
    if (topicID) {
      leaveTopicRoom(socket);
    }
  });

  // connected happens before Topics
  socket.emit('connected', socket.id);

  // subscribe called by client
  redisSub.setMaxListeners(15);

  redisSub.on('message', (channel, message) => {
    jl3('redisSub.on() message', message);

    let incoming;
    try {
      incoming = safeParseJSON(message);
    } catch (error) {
      console.error(
        typeof message === 'object' ? 'pubsub message must be a string' : error
      );
    }

    // Check if topicID is included in the incoming message
    // if (!incoming.topicID || !socket.handshake.auth.userID) {
    //   return; // Exit if topicID is missing
    // }

    const msg = { channel, incoming };

    connectionColor(
      `Sending ${socket.handshake.auth.userID} msg :>> \n${pj(msg)}`
    );

    // TODO use io.emit.to(room)
    // socket.emit('message', msg);
    io.to(incoming.topicID).emit('message', msg);
  });

  const mapWithSetToObject = (map) => {
    const obj = {};
    for (const [key, value] of map.entries()) {
      obj[key] = Array.from(value); // Convert Set to array
    }
    return obj;
  };

  const subscribe = (subscriptions) => {
    if (isEmpty(subscriptions.filter(Boolean))) {
      console.error('subscribed will be empty');
      return;
    }

    jl('subscribe(subscriptions)', subscriptions);
    // ignore second param [cb] sent by emitFromClient2()
    const subscribed = head(subscriptions);

    subscribed.forEach((channel) => {
      redisSub.subscribe(channel);

      if (subTracker.has(channel)) {
        const channelSubscribers = subTracker.get(channel);
        if (!channelSubscribers.has(socket.handshake.auth.userID)) {
          channelSubscribers.add(socket.handshake.auth.userID);
        }
      } else {
        const userSet = new Set();
        userSet.add(socket.handshake.auth.userID);
        subTracker.set(channel, userSet);
      }
    });
    jl('subscribed', mapWithSetToObject(subTracker));
    console.log(' ');

    const ct = redisSub.listenerCount('message');
    console.warn(`Subscribed listening for the Redis 'message' event: ${ct}`);
    io.emit('joined', allSockets);
  };

  const unsubscribe = () => {
    for (const [channel] of subTracker) {
      if (subTracker.get(channel).has(socket.handshake.auth.userID)) {
        subTracker.get(channel).delete(socket.handshake.auth.userID);
      }

      if (isEmpty(channel)) {
        subTracker.delete(channel);
        redisSub.unsubscribe(channel);
      }
    }
    jl('Remaining subscribed', mapWithSetToObject(subTracker));

    const ct = redisSub.listenerCount('message');
    console.warn(`Number now listening for the Redis 'message' event: ${ct}`);
  };
  //#region  direct events: unsubscribe, request/releaseEdit

  socket.on('requestEdit', () => {
    const userId = socket.handshake.auth.userID;
    const topicID = socket.handshake.auth.topicID;
    console.warn(
      `${myDate()}  ACCESS CONTROL:requestEdit editorLock, userId, topicID :>> `,
      editorLock,
      userId,
      topicID
    );
    if (!editorLock || editorLock === userId) {
      editorLock = userId;
      console.log(
        'editorLock, userId, topicID :>> ',
        editorLock,
        userId,
        topicID
      );
      socket.emit('grantEdit', { userId, topicID, canEdit: true });
      console.warn(
        `${myDate()}  ACCESS CONTROL:requestEdit ${editorLock} granted Edit. locked is true for others`
      );
      io.emit('lockStatus', { userId, topicID, locked: true });
    } else {
      socket.emit('grantEdit', false);
      console.warn(
        `${myDate()}  ACCESS CONTROL:requestEdit grantEdit is false  and locked is true`
      );
    }
    console.log(' ');
  });

  socket.on('releaseEdit', () => {
    const userId = socket.handshake.auth.userID;
    const topicID = socket.handshake.auth.topicID;

    console.log(
      `${myDate()}  ACCESS CONTROL:releaseEdit editorLock on ${topicID} for ${userId} :>> `,
      editorLock
    );

    if (editorLock === userId) {
      editorLock = null;
      console.log(`${myDate()}  ACCESS CONTROL:releaseEdit unlocked`);
      io.emit('lockStatus', { userId, topicID, locked: false });
    }
    console.log(' ');
  });

  //#endregion
  const collaborationEvents = ['requestEdit', 'releaseEdit'];
  socket.onAny((event, ...args) => {
    console.log(' ');
    connectionColor(`
       Handling event: ${event}`);

    // TODO fix this order for cb
    printResults(
      `${event}()`,
      typeof args[0] === 'function' ? 'a function' : args
    );
    if (!collaborationEvents.includes(event)) {
      matchMe(event, args);
    }
  });

  const matchMe = (event, args) => {
    // map INTENT to Redis
    // Step 8: add binding to new INTENT
    const match = {
      createConnection: addStream,
      createCampaign: addStream,
      readConnection: getStream,
      scanConnections: scanStreams,

      scanEventTokens: scanStreams,

      scanTokens: scanStreams,

      scanEvents: scanStreams,

      archiveConnection: archiveStream,

      earnTokens: addStream,
      burnTokens: addStream,
      readTokens: getStream,

      createEvent: addStream,
      readEvent: getStream,
      readEventTokens: getStream,
      earnEventTokens: addStream,
      burnEventTokens: addStream,

      //half-duplex comms
      // consumer/Tokens.vue starts E&B protocol with tokenRequest
      // onTokenRequest emits 'approveTokens' event to Producer
      tokenRequest: onTokenRequest,
      tokensApproved: onTokensApproved,
      declinedTokens: onDeclinedTokens,
      // deferred to B2.x
      delegateRequest: onDelegateRequest,

      sendMessage: onSendMessage,
      patches: onPatches,

      // the new component model passes these params:
      // const context = {
      //   preamble,
      //   nonce,
      //   pid,
      //   cid,
      //   oid,
      //   eventName,
      //   tokens,
      //   redirect,

      // }
      // some params may have null values. if so, those params are not relevant to the targetName.
      campaigns: campaigns,
      rewards: rewards,
      contacts: contacts,
      issues: issues,
      theme: theme,

      subscribe: subscribe,
      unsubscribe: unsubscribe,

      audit: audit,

      // test: test,
    };
    try {
      match[event](args, socket, io);
    } catch (error) {
      logError(`${error.message}: ${event}`);
    }
  };
});
// Function to list all connected sockets
// function listAllConnectedSockets(topicID) {
//   const sockets = io.of('/').sockets;
//   // what's in sockets?
//   const collaborators = new Set();
//   sockets.forEach((socket) => {
//     if (socket.handshake.auth.userID) {
//       collaborators.add(socket.handshake.auth.userID);
//     }
//   });
//   jl3(`${myDate()}Topic collaborators`, {
//     topicID,
//     collaborators: [...collaborators],
//   });
//   return [...collaborators];
// }

//#endregion Socket.io

//#region Docs
/*
KEY variable above is based on these values in this order (viz., the order of all keys)
 const { preamble, owner, hash, id } = key;
 a key tells us what data to add to Redis
 and how to return data to the client. we split the key into an array:

 array[0] = tqr preamble
 array[1] = country preamble
 array[2] = owner (either a pid for Connections or a nonce (which serves as Campaign ID) for everything else)
 array[3] = hash (Campaign Event Tokens concats Event name,:,hash; or hash alone for everything else)
 array[4] = id (cid for Reward and Campaign Event Tokens; for everything else, nonce)

 // ======================= special case (six keyParts) =======================
 Campaign Event Token example :
 'tqr:xx:mpc@chrome@220@oops:Test Event:tokens:1651857240675-x';
  [0] [1][2]                 [3]        [4]    [5]           // rendering results will split this key into six parts

 ======================= all other cases (five keyParts) =======================

 Connection example (Campaigns are the same but use a burnType='campaign' value):
 tqr:xx:1651857240675-x:connections:mpc@dbg@675@x@uhoh
 [0] [1][2]                 [3]    [4]

 Events example:
 tqr:xx:mpc@chrome@220@oops:events:Test Event
 [0] [1][2]                 [3]    [4]

 Reward tokens example:
 tqr:lo:chrome@220:tokens:1661373831173-0
 [0] [1][2]        [3]    [4]

General pattern:
       key: {
        preamble: 'tqr:xx', // [0] [1]
        owner: '', // [2] pid or nonce
        hash: 'tokens[:eventName]', // [3]
        id: '1651857240675-x', // [4] nonce (mpc@chrome@220@oops), cid, or event name (Test Event) or [5] could be hash (tokens) or [5] a cid (1651857240675-x)
      },
 */
//#endregion Docs

//#region TQR API
const campaigns = (parameters) => {
  const { TARGETS } = require('./ops/campaigns');

  const params = head(parameters);
  console.log('params', pj(params));

  const ack = parameters.at(-1);

  const targetName = parameters[1];
  if (!targetName || typeof targetName === 'function') {
    oopsColor(`
      !!!!!!!!!!!!!!!!!!!!  Contract Violation !!!!!!!!!!!!!!!!!!!!
                             Empty targetName
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      `);

    return;
  }

  const {
    preamble,
    owner,
    nonce,
    pid, // used to find the Campaigns for Producer for /campaigns route
    cid,
    eventName,
    tokens,
    defer,
    redirect,
    burnRedirectUrl,
    bannerUrl,
    burnBannerUrl,
    campaignUrl,
    query, // used by CALL
  } = params;

  // all called modules have the same input params
  const target = TARGETS[targetName]; // this is passed in from client
  connectionColor(`targetName: ${targetName}`);
  connectionColor('target :>> ', pj(target));
  // if targetName is not in TARGETS, the next line will fail when getting the call from CALLS
  if (!target) {
    throw new Error('taget not in TARGETS');
  }
  const { init, op, transform } = require(`./ops/${target.call}`);

  // for Campaigns:
  //  array[0] = tqr preamble
  //  array[1] = country preamble
  //  array[2] = owner (either a pid for Connections or a nonce (which serves as Campaign ID) for everything else)
  //  array[3] = hash (Campaign Event Tokens concats Event name,:,hash; or hash alone for everything else)
  //  array[4] = id (cid for Reward and Campaign Event Tokens; for everything else, nonce)
  const CALLS = {
    // tqr:xx:mpc@chrome@220@oops:Test Event:tokens:1651857240675-x
    // [0][1] [2]                 [3]        [4]    [5]           // rendering results will split this key into six parts
    createCampaign: {
      intent: `${target.crd}${target.name}`,
      owner,
      hash: target.hash,
      value: { burnType: 'campaign', tokens, campaignUrl },
      redis: addStream,
    },
    scanConnections: {
      intent: `${target.crd}${target.name}`,

      owner: pid,
      hash: `${target.hash}`,
      id: nonce || '*',
      value: {},

      redis: scanStreams,
    },
    archiveCampaign: {
      intent: `${target.crd}${target.name}`,

      owner: pid,
      hash: `${target.hash}`,
      id: nonce,
      value: {},

      redis: archiveStream,
    },
    archiveEvent: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${target.hash}:${eventName}`,
      value: {},

      redis: archiveStream,
    },
    createEvent: {
      intent: `${target.crd}${target.name}`,
      owner: nonce,
      hash: `${target.hash}:${eventName}`,
      value: {
        tokens,
        defer,
        redirect,
        burnRedirectUrl,
        bannerUrl,
        burnBannerUrl,
      },
      redis: addStream,
    },

    // scan 0 match tqr:lo:cityhall:events:*
    scanEvents: {
      intent: `${target.crd}${target.name}`,
      owner: nonce,
      hash: `${target.hash}`,
      id: '*',

      value: {},
      redis: scanStreams,
    },
    scanEventTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${eventName}:${target.hash}`,
      id: cid,

      value: {},
      redis: scanStreams,
    },
    readEvent: {
      //tqr:lo:chrome@Test:Test Event:tokens:1673304964492-0
      //TODO manual override for get instead of CRDs value passed in
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${eventName}:tokens:`,

      value: {},
      redis: getStream,
    },
    readEventTokens: {
      //tqr:lo:chrome@Test:Test Event:tokens:1673304964492-0
      //TODO manual override for get instead of CRDs value passed in
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${eventName}:tokens:`,
      id: cid,

      value: {},
      redis: getStream,
    },
    earnEventTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${eventName}:${target.hash}`,
      id: cid,

      value: { eventName, nonce, tokens, redirect },
      redis: addStream,
    },
    burnEventTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${eventName}:${target.hash}`,
      id: cid,

      value: { eventName, nonce, tokens },
      redis: addStream,
    },

    getHash: {
      intent: `${target.crd}${target.name}`,
      value: query,

      redis: getHash,
    },

    setHash: {
      intent: `${target.crd}${target.name}`,

      value: query,

      redis: setHash,
    },
    getMHash: {
      intent: `${target.crd}${target.name}`,
      //hash: 'query',
      value: query,

      redis: getMHash,
    },

    setMHash: {
      intent: `${target.crd}${target.name}`,

      // hash: 'query',
      value: query,

      redis: setMHash,
    },
  };
  const call = CALLS[`${target.crd}${target.name}`];

  headingColor('Intent:');
  console.warn(pj(call));

  init({ preamble, nonce, pid, cid, eventName, call });

  // the op() function will call campaigns.js to get a key from keys()
  // that provides the context object for the specified intent
  // viz., call.intent (where the the targetName appears in CALLS)
  // NOTE: if op() returns an empty object, it's because there is not intent in the keys() object
  // e.g.,  readEvent: eventKey() was missing when adding this intent to the server
  const args = [
    op(),
    (result) => {
      if (!Array.isArray(result[0])) {
        return result[0];
      }
      return transform(result);
    },
  ];

  return call
    .redis(args) // returned by args above (including call back to transform result)
    .then((results) => safeAck(ack, results, `campaigns.${nonce}.${eventName}`))
    .then((result) => {
      return result;
    });
};

const rewards = (parameters) => {
  //#region Setup
  const { TARGETS } = require('./ops/rewards');
  const params = head(parameters);
  const ack = parameters.at(-1);

  const targetName = parameters[1];
  if (!targetName || typeof targetName === 'function') {
    oopsColor(`
      !!!!!!!!!!!!!!!!!!!!  Contract Violation !!!!!!!!!!!!!!!!!!!!
                             Empty targetName
      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      `);
    return;
  }
  console.log('Inputs');
  connectionColor(`targetName: ${targetName}`);
  headingColor('params'), pj(params);

  const {
    preamble,
    owner,
    nonce,
    pid,
    cid,
    tokens,
    tokenMin,
    redirect,
    hashName,
    hashField,
    hashData,
    json,
    query, // used by CALL
    eventName,
  } = params;

  // all called modules have the same input params
  // add other modules as necessary

  const target = TARGETS[targetName]; // this is passed in from client

  // target.name is used to concat the function to update Redis:
  // e.g., intent= archive and target='Connection' = archiveConnection()
  const { init, op, transform } = require(`./ops/${target.call}`);

  // this is where you set the owner and id fields required by op()
  const CALLS = {
    // http://localhost:3333/producer/1664155972140-0/mpc@rewards?t=1&tMax=1
    createConnection: {
      intent: `${target.crd}${target.name}`,

      owner,
      hash: target.hash,
      id: nonce,
      value: { burnType: 'auto', tokens: tokenMin, tokenMin },

      redis: addStream,
    },

    archiveConnection: {
      intent: `${target.crd}${target.name}`,

      owner,
      hash: `${target.hash}`,
      id: nonce,
      value: {},

      redis: archiveStream,
    },
    archiveEvent: {
      intent: `${target.crd}${target.name}`,

      owner,
      hash: `${target.hash}`,
      id: eventName,
      value: {},

      redis: archiveStream,
    },

    scanConnections: {
      intent: `${target.crd}${target.name}`,

      owner: pid,
      hash: `${target.hash}`,
      id: nonce || '*',
      value: {},

      redis: scanStreams,
    },

    scanTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce || '*',
      hash: `${target.hash}`,
      id: cid || '*',
      value: {},

      redis: scanStreams,
    },

    earnTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${target.hash}`,
      id: cid,
      value: { nonce, tokens, redirect },

      redis: addStream,
    },
    burnTokens: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: `${target.hash}`,
      id: cid,
      value: { nonce, tokens },

      redis: addStream,
    },

    getHash: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: hashName,
      value: { hashField },

      redis: getData, // was getHtml
    },
    setHash: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: hashName,
      value: { hashField, hashData },

      redis: setData, // was setHtml
    },

    getMHash: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: 'urls',
      value: { query },

      redis: getMHash,
    },
    setMHash: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: 'urls',
      value: { query },

      redis: setMHash,
    },

    getJson: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: 'urls',

      redis: getJson,
    },
    setJson: {
      intent: `${target.crd}${target.name}`,

      owner: nonce,
      hash: 'urls',

      value: { json },

      redis: setJson,
    },
  };
  const call = CALLS[`${target.crd}${target.name}`];
  if (!call) {
    console.error(`call not found with ${target.crd}${target.name}`);
    throw new Error('CALLS error');
  }

  //#endregion Setup

  // function in CALLS
  init({ preamble, nonce, pid, cid, call });

  // First BP here. check call field values. Second one below on call
  const args = [
    op(),
    (result) => {
      return result ? transform(result) : '';
    },
  ];
  console.log(
    connectionColor(`#################  Component Data #################
    `)
  );
  console.log('call :>> ', pj(call));
  console.log('args :>> ', pj(args[0]));
  console.log(
    connectionColor(`###################################################
    `)
  );

  // Second rewards BP here.
  return call
    .redis(args)
    .then((results) => safeAck(ack, results, 'rewards'))
    .then((result) => {
      return result;
    });
};

const contacts = (parameters) => {
  const { execute } = require('./AEgisTqr');
  // execute uses crd and context params
  // const execute = { crd, context };

  const data = head(parameters);
  const ack = parameters.at(-1);

  lookAtMeColor('[DEBUG]\nOpen for parameter data:');
  console.log(data);
  console.table(Object.entries(data));
  console.log("''''''''''''''''''''''' Executing ''''''''''''''''''''");

  return execute(data)
    .then((jcard) => {
      safeAck(ack, jcard);
      if (jcard?.error) {
        jl('\n\n\nindex.js execute() ERROR', jcard.error);
        if (process.connected) {
          // debugger;
        }
      }
      // TODO ensure there is no side-effect from disabling this return after all these years of use
      // return jcard;
    })
    .catch((e) => {
      console.error(`[ERROR]${e}`);
      // TODO figure out how to get a ref to socket so we can notify client of error
      safeAck(ack, `ERROR: ${e}`);
      // throw new Error(e);
    });
};
const issues = (parameters) => {
  const { execute } = require('./AEgisTqr');
  // execute uses crd and context params
  // const execute = { crd, context };
  console.log('Issues Parameters:', parameters);

  const data = head(parameters);
  const ack = parameters.at(-1);
  console.log('data :>> ', pj(data));

  return execute(data)
    .then((jcard) => {
      safeAck(ack, jcard);
      return jcard;
    })
    .catch((e) => {
      console.error(e);
    });
};

const theme = (parameters) => {
  const { execute } = require('./AEgisTqr');
  // execute uses crd and context params
  // const execute = { crd, context };
  console.log('Theme Parameters:', parameters);

  const data = head(parameters);
  const ack = parameters.at(-1);
  console.log('data :>> ', pj(data));

  return execute(data)
    .then((result) => {
      safeAck(ack, result);
      return result;
    })
    .catch((e) => {
      console.error(e);
    });
};

//#endregion TQR API

module.exports = { campaigns, rewards, contacts, issues, theme };

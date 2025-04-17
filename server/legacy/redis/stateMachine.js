const { clientCall } = require('./testServer');

//#region Helpers
// convenience to turn any named second arg to the context prop
const getArgs = (crd, context) => {
  return { crd, context };
};
// used to prompt coder for requird fields
const readyNewConnection = ({ preamble, nonce, id, payload }) => {
  return { preamble, nonce, id, payload };
};
const trace = (data) => {
  console.table(data.flat(2));
  return data;
};
// if you want to use regex: const regexConn = /(tqr:xx:\d+(\-\d)*)/;
const ownerExits = (connections, opk) =>
  connections.filter((v) => typeof v === 'string' && v.includes(opk)).length;

//#endregion

const stateMachine = ({ opk, cpk, offer }) => {
  console.log('opk:', opk, 'cpk:', cpk);

  const addConnection = () => {
    readyNewConnection({
      preamble: `tqr:xx:${opk}:connections`,
      nonce: getNonce(opk),
      id: '',
      payload: payloadConnection,
    });
    const args = getArgs('create', context);
    console.table([args]);
    clientCall(args);
  };

  const addOffer = () => {
    console.table(offer);
    console.warn('addOffer() coming soon');
    match[2]();
  };
  const listOffers = () => {
    console.warn('listOffers() coming soon');
    match[3]();
  };
  const listProducerTokens = () => {
    console.warn('listProducerTokens() coming soon');
    match[4]();
  };
  const listConsumerTokens = () => {
    console.warn('listConsumerTokens() coming soon');
    match[5]('End of run');
  };

  //#region Initialization
  let crd = 'scan';
  // this initial context contains minimum data for AEgisTqr.js to
  // scan for owners (a prereq for any testing)
  let context = {
    preamble: 'tqr:xx*connections',
    id: '*',
    payload: {}, // payload cannot be undefined, empty is ok
  };
  const init = () =>
    clientCall({ crd, context })
      .then((connections) => trace(connections))
      .then((connections) => ownerExits(connections, opk));

  init().then((answer) => match[answer]());
  //#endregion Initialization

  // if redis has 1659420864784-0
  // then add Offer
  // else add connection
  const match = {
    0: addConnection,
    1: addOffer,
    2: listOffers,
    3: listProducerTokens,
    4: listConsumerTokens,
    5: console.log,
  };
};

const producers = [
  ['1659059618220-0', 'mpc@dbg220'],
  ['1659069524589-0', 'mpc@chrome589'],
  ['1659420864784-0', 'mpc@server'],
];
const consumers = ['1651857240675-0', '1659069524589-0'];
const getNonce = (opk) => producers.find((v) => v[0] === opk)[1];
const payloadConnection = {
  burnType: 'auto',
  tokenMin: 1,
  tokenMax: 1,
};
stateMachine({ opk: producers[2][0], cpk: consumers[0] });

//////////////////////////////////  EXPERIMENTAL LAB  ///////////////////////////////
const { contacts } = require('../index');

const {
  isEmpty,
  oopsColor,
  passedColor,
  pj,
  tokenColor,
} = require('../utils/helpers');

// Test this:
// tqr:lo:chrome@welcome:New User:tokens:1673598462824-0
// archive:
// tqr:lo:dbg@camp:events:Main Event
const preamble = 'tqr:lo';
const reward = 0;
const campaign = 1;
const dbg = 0;
const chrome = 1;
const firefox = 2;
const nonces = ['*'];
const ids = ['1674030133752-0', '*'];
const eventName = '*';

//   oid,
//   description,
//   offerUrl,

// runtime parameters for Rewards
// and Campaigns
const contextReward = {
  connection: {
    preamble,
    owner: ids[chrome], // connection string includes pid
    nonce: nonces[reward], // : 'chrome@reward@220';
  },
  archive: {
    preamble,
    owner: ids[chrome], // connection string includes pid
    nonce: nonces[reward], // : 'chrome@reward@220';
  },

  tokens: {
    preamble,
    nonce: nonces[0], // : 'chrome@reward@220';
    cid: ids[0],
  },
  earn: {
    preamble,
    nonce: nonces[reward], // : 'chrome@reward@220';
    cid: ids[firefox],
    tokens: 2,
  },
  burn: {
    preamble,
    nonce: nonces[reward], // : 'chrome@reward@220';
    pid: ids[chrome],
    cid: ids[firefox],
    tokens: -2,
  },
  redir: {
    preamble,
    nonce: nonces[chrome],
    cid: ids[firefox],
    tokens: 2,
    redirect: 'https://tqrtoken.com',
  },
  burnUrl: {
    preamble,
    nonce: nonces[chrome],
    pid: ids[chrome],
    cid: ids[firefox],
    tokens: 2,
    burnUrl: 'https://tqrtoken.com',
  },
};

const contextCampaign = {
  archive: {
    preamble,
    owner: ids[0], // connection string includes pid
    nonce: nonces[0], // : 'chrome@reward@220';
  },
  archiveEvent: {
    preamble,
    nonce: nonces[0],
    eventName,
  },
  event: {
    preamble,
    nonce: nonces[campaign], // : 'chrome@campaign@220';
    eventName,
    tokens: 1,
  },
  readEvent: {
    preamble,
    nonce: nonces[0], // : 'chrome@campaign@220';
    eventName,
  },
  eventTokens: {
    preamble,
    nonce: nonces[0], // : 'chrome@campaign@220';
    eventName,
    cid: ids[0],
  },
  readEventTokens: {
    preamble,
    nonce: nonces[0], // : 'chrome@campaign@220';
    eventName,
    cid: ids[0],
  },

  earn: {
    preamble,
    // passed in $router.params
    nonce: nonces[campaign], // : 'chrome@campaign@220';
    // passed in $router.query
    eventName,
    tokens: 1,
    // Consumer's pk
    cid: ids[dbg],
  },
  burn: {
    preamble,
    // passed in $router.params
    nonce: nonces[campaign], // : 'chrome@campaign@220';
    // passed in $router.query
    eventName: 'Event 13',
    pid: ids[chrome],
    tokens: -1,
    // Consumer's pk
    cid: ids[dbg],
  },

  redir: {
    preamble,
    nonce: nonces[chrome],
    cid: ids[firefox],
    tokens: 2,
    redirect: 'https://tqrtoken.com',
  },
  burnUrl: {
    preamble,
    nonce: nonces[chrome],
    pid: ids[chrome],
    cid: ids[firefox],
    tokens: 2,
    burnUrl: 'https://tqrtoken.com',
  },
  getMHash: {
    preamble: 'tqr:lo:dbg@camp@campUrl:urls:Test CampURL',
    query: [],
  },
  getMHash2: {
    preamble: 'tqr:lo:dbg@camp@campUrl:urls:Test CampURL',
    query: ['e', 't', 'g'],
  },
  setMHash: {
    preamble: 'tqr:lo:dbg@camp@campUrl:urls:Test CampURL',
    query: { e: 'Test Camp URL', t: 1, g: 'https://tqrtoken.com' },
  },
};

const display = (result) => {
  tokenColor('************************************************************');

  const msg = isEmpty(result)
    ? oopsColor('Test FAILED')
    : passedColor(`  Test PASSED  `);
  msg();

  tokenColor(pj(result));

  tokenColor('************************************************************');

  return result;
};

/*
  Read data by Reward nonce (all CIDs and tokens),
  Campaign nonce (all events and all tokens),
  Campaign's Event nonce (all tokens earned by all CIDs for the event),
  CID (all Rewards and Campaigns/Events tokens earned by this CID)
*/

//////////////////// control parameters ////////////////////
const testRewards = 0;

// TODO do we really need TARGET_NAMES for testing? or is CRDs enough?
// const R = require('../ops/rewards');
// const C = require('../ops/campaigns');
// const ALL_TARGET_NAMES = { ...R.TARGET_NAMES, ...C.TARGET_NAMES };
// const ALL_TARGETS = { ...R.TARGETS, ...C.TARGETS };

const context = testRewards ? contextReward : contextCampaign;

// this targetName identifies a TARGET that identifies a function to update Redis
// see comment in rewards() above where we get TARGET using the targetName set here.
const C = require('../ops/campaigns');

///////////// Primary step: setting targetName enables most of the rest of this code's functionality.
const targetName = C.TARGET_NAMES.eventTokens; // ERRORS IF YOU PICK AN ENUM THAT IS NOT IN THE ROLE'S TARGET_NAMES
/////////////

// 'readEventTokens',
// {
//   key: {
//     preamble: 'tqr:xx',
//     owner: players.producer.nonce,
//     hash: 'tokens',
//     id: cid,
//   },
//   value: {
//     start: '-',
//     end: '+',
//   },
// },

const args = [context[targetName], targetName, display];
console.log('===================================');
tokenColor('args :>> ', pj(args));
console.log('===================================');
const role = contacts; //testRewards ? rewards : campaigns;
role(args).then((done) => {
  try {
    if (Array.isArray(done)) {
      console.log(
        done[0][1].reduce((a, c) => {
          a += parseInt(c.tokens);
          return a;
        }, 0)
      );
    }
  } catch (error) {
    console.warn('result:', pj(done));
  }
});

/////////////////////////////////////////////////////////////////
/*
key:    tqr:zz:VIPPASSSomerset@SCOOOP:events:SCOOOP
value:  {"tokens":"1","start":"2022-11-15","end":"100","redirect":"https://tinyurl.com/earninstructions","burnUrl":"https://www.instagram.com/scooop_cp/","bannerUrl":"https://ik.imagekit.io/tqrtoken/sg/events/VIPPASSSomerset_Scooop/VIPPASSSomerset_Scooop_Event_Earn_Banner.jpeg","burnBannerUrl":"https://ik.imagekit.io/tqrtoken/sg/events/VIPPASSSomerset_Scooop/VIPPASSSomerset_Scooop_Event_Burn_Banner.jpeg"}
*/

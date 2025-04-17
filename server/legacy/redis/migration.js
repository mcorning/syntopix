const { safeParseJSON } = require('../../src/js/helpers');
const aegis = require('./setup');
const fs = require('fs');
const pj = (data) => JSON.stringify(data, null, 2);

const getTokensOld = (key) => {
  return aegis.redis.xrange([key, '-', '+']).then((val) => [key, val]);
};

const getConnectionKeys = () => {
  const json = safeParseJSON(fs.readFileSync('./migratedKeys.json', 'utf8'));
  return json.find((v) => v[0] === 'tqr:sg-old:connections');
};

const backup = (log) => {
  const makeMap = (results) => {
    const map = new Map(results);
    try {
      const mapString = pj([...map]);
      fs.writeFileSync('./migratedKeys.json', mapString);
      if (log) {
        console.log(
          './migratedKeys.json :>> ',
          fs.readFileSync('./migratedKeys.json', 'utf8')
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const run = (keys) => {
    const promises = keys.map((key) => {
      return aegis.redis.xrange([key, '-', '+']).then((val) => {
        console.log(key, val, '.');
        return [key, val];
      });
    });
    return Promise.all(promises)
      .then((results) => makeMap(results))
      .then(() => console.log('finsihed'));
  };

  aegis.redis.keys('tqr:sg*').then((keys) => run(keys));
};

const restore = (log) => {
  const makeMap = (results) => {
    const map = new Map(results);
    try {
      const mapString = pj([...map]);
      fs.writeFileSync('./migratedKeys.json', mapString);
      if (log) {
        console.log(
          './migratedKeys.json :>> ',
          fs.readFileSync('./migratedKeys.json', 'utf8')
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const run = (keys) => {
    const promises = keys.map((key) => {
      return aegis.redis.xrange([key, '-', '+']).then((val) => [key, val]);
    });
    return Promise.all(promises)
      .then((results) => makeMap(results))
      .then(() => console.log('finsihed'));
  };

  aegis.redis.keys('tqr:sx*').then((keys) => run(keys));
};

/*
From original data:

[
  "tqr:sg:connections",
  [
    "tqr:sg:Magmarvel@Omookase#promos",
    [
      {"promoName":"Live performance every Friday, Saturday and Sunday 7-9pm",
      "promoUrl":"https://wusic.12engage.com"
    }
  ]
]


i'm looking for Map with:
key   = tqr:sx:Magmarvel@Omookase:offers

value =
    [
      {
        "promoName":"Live performance every Friday, Saturday and Sunday 7-9pm",
        "promoUrl":"https://wusic.12engage.com"
      }
    ]
*/
const transformEvents = () => {
  const newMap = new Map();
  const json = safeParseJSON(fs.readFileSync('./migratedKeys.json', 'utf8'));
  const keys = json.filter((v) => v[0].endsWith('promos'));
  // console.log('keys:', pj(keys));
  keys.map((v) => {
    const key = v[0].replace('sg', 'sx').replace('#promos', ':offers');
    console.log(key);
    const values = v[1];
    values.map((v) => {
      const val = { offerName: v.promoName, offerUrl: v.promoUrl };
      console.log(val);

      aegis.redis.xadd([key, '*', val]);
      newMap.set(key, val);
    });
    console.log(pj([...newMap]));
  });
};

/*
From original data:

[
  "tqr:sg:connections",
  [
    "tqr:sg:Magmarvel@TomahawkKing#redemptions",
    [
      {
        "id": "1655109639811-0",
        "cid": "1653279585815-0",
        "points": "4"
      },
      {
        "id": "1655261359463-0",
        "cid": "1655110373259-0",
        "points": "1"
      },
  ]
]


i'm looking for Map with:
key   = tqr:sx:Magmarvel@TomahawkKing:tokens

value = {"cid":"1653279585815-0","tokens":"-4"}
*/
const transformRedemptions = () => {
  const newMap = new Map();
  const json = safeParseJSON(fs.readFileSync('./migratedKeys.json', 'utf8'));
  const keys = json.filter((v) => v[0].endsWith('redemptions'));
  // console.log('keys:', pj(keys));
  keys.map((v) => {
    const key = v[0].replace('sg', 'sx').replace('#redemptions', ':tokens');
    console.log(key);
    const values = v[1];
    values.map((v) => {
      if (v.cid) {
        const val = { cid: v.cid, tokens: -v.points };
        console.log(val);

        aegis.redis.xadd([key, '*', val]);
        newMap.set(key, val);
      }
    });
    console.log(pj([...newMap]));
  });
};
/*
From original data:

[
  "tqr:sg:connections",
  [
    "tqr:sg:Magmarvel@TomahawkKing#tokens",
    [
      {
        "id": "1654070354283-0",
        "nonce": "Magmarvel@TomahawkKing",
        "cid": "1653279585815-0",
        "tokens": "1"
      },
      {
        "id": "1654163938069-0",
        "nonce": "Magmarvel@TomahawkKing",
        "cid": "1652937597675-0",
        "tokens": "1"
      },
  ]
]


i'm looking for Map with:
key   = tqr:sx:Magmarvel@TomahawkKing:tokens

value = {"cid":"1652937597675-0","tokens":"1"}
*/
const transformTokens = () => {
  const newMap = new Map();
  const json = safeParseJSON(fs.readFileSync('./migratedKeys.json', 'utf8'));
  const keys = json.filter((v) => v[0].endsWith('tokens'));
  // console.log('keys:', pj(keys));
  keys.map((v) => {
    const key = v[0].replace('sg', 'sx').replace('#', ':');
    console.log(key);
    const values = v[1];
    values.map((v) => {
      if (v.cid) {
        const val = { cid: v.cid, tokens: v.tokens };
        console.log(val);

        aegis.redis.xadd([key, '*', val]);
        newMap.set(key, val);
      }
    });
    console.log(pj([...newMap]));
  });
};

/*
From original data:

[
  "tqr:sg:connections",
  [
    {
      "id": "1654068661584-0",
      "nonce": "Magmarvel@TomahawkKing",
      "owner": "1653545871305-0",
      "pin": "1001",
      "approval": "{\"type\":\"auto\",\"interval\":\"day\",\"tokenMin\":1,\"tokenMax\":1}",
      "userAgent": "Google Chrome"
    },
    {
      "id": "1654068734145-0",
      "nonce": "Magmarvel@Omookase",
      "owner": "1653545871305-0",
      "pin": "1002",
      "approval": "{\"type\":\"auto\",\"interval\":\"day\",\"tokenMin\":1,\"tokenMax\":1}",
      "userAgent": "Google Chrome"
    }
  ]
]


i'm looking for Map with:
key   = tqr:sx:1653545871305-0:connections:Magmarvel@TomahawkKing
value = {"burnType":"auto","tokenMin":"1","tokenMax":"1","modulus":"0"}
*/
const transformConnections = () => {
  const newMap = new Map();
  const keys = getConnectionKeys();
  console.log('keys:', pj(keys));

  keys[1].map((v) => {
    const key = `tqr:sx:${v.owner}:connections:${v.nonce}`;
    console.log(key);
    const approval = safeParseJSON(v.approval);
    const val = {
      burnType: approval.type,
      tokenMin: approval.tokenMin,
      tokenMax: approval.tokenMax,
      modulus: 0,
    };
    aegis.redis.xadd([key, '*', val]);
    newMap.set(key, val);
    console.log(pj([...newMap]));
  });
};

const startOver = false;
if (startOver) {
  transformConnections();
  transformTokens();
  transformRedemptions();
  restore(true);
  transformEvents();
  backup(true);
}

getTokensOld('tqr:sg-old:Magmarvel@Omookase#tokens').then((stream) => {
  const data = stream[1];
  const vals = data.filter((v) => v.cid != '');
  console.log('val :>> ', pj(vals));

  vals.map((v) => {
    const { id, cid, tokens } = v;

    aegis.redis.xadd(['tqr:sg:Magmarvel@Omookase:tokens', id, { cid, tokens }]);
  });
});

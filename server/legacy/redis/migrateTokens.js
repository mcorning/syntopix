const aegis = require('./setup');
const fs = require('fs');
const pj = (data) => JSON.stringify(data, null, 2);
const { safeParseJSON } = require('./redis/syntopix/helpers');

const getTokens = (key) => {
  return aegis.redis.xrange([key, '-', '+']).then((val) => [key, val]);
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

const KEY = 'tqr:sg:Magmarvel@TomahawkKing:tokens'; //'tqr:sg:Magmarvel@Omookase:tokens';
const fix = () => {
  getTokens(KEY).then((stream) => {
    const data = stream[1];
    const vals = data.filter((v) => v.cid != '');
    console.log('val :>> ', pj(vals));
    console.log(vals.length);
    vals.forEach((v) => {
      const cid = v.cid;
      const val = { pid: '1653545871305-0', tokens: v.tokens };
      const id = v.id;
      const key = `${stream[0]}:${cid}`;
      aegis.redis.xadd(key, id, val);
    });
    /*
  tqr:sg:Magmarvel@Omookase:tokens
  */

    // vals.map((v) => {
    //   const { id, cid, tokens } = v;

    //   aegis.redis.xadd(['tqr:sg:Magmarvel@Omookase:tokens', id, { cid, tokens }]);
    // });
  });
};

const startOver = false;
if (startOver) {
  transformTokens();
  restore(true);
  backup(true);
  fix();
}
fix();

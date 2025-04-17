const { redis, redisPub, redisSub } = require('./redis/setup');
const { safeParseJSON } = require('./redis/syntopix/helpers');

const {
  clc,
  head,
  isEmpty,
  jl,
  jl3,
  pj,
  url,
  headingColor,
  logMap2,
  passedColor,
  tokenColor,
} = require('./utils/helpers');
const unpackError = (e) => {
  const msg = `${e.message}
  ${pj(e.command.args)}`;
  console.error(msg);
};

const test = (promise) => {
  const [func, arg] = promise;
  func(arg).then((x) => {
    jl('x', x);
  });
};

// independent API (does not go through testServer.js)
const audit = (args) => {
  if (Array.isArray(args)) {
    args = args[0];
  }
  console.log('args :>> ', pj(args));
  const {
    data: [key, value],
    ttlm = 5,
  } = args;
  const cmd = [key, '*', 'msg', value];
  url(`audit().cmd :>> ${cmd}`);
  console.log('ttlm', ttlm);
  const ttl = -1; //60 * ttlm; // Redis expires this key in ttl seconds
  console.warn('ttl set for ', ttl);
  return redis
    .xadd(cmd)
    .then((newSid) => {
      console.log('newSid :>> ', newSid);
      redis.expire(key, ttl);
      return newSid;
    })
    .catch((e) => e.message);
};

// const getHost = (country) => {
//   const { port, password, showFriendlyErrorStack } = redis.options;
// console.warn(pj({ country, port, password, showFriendlyErrorStack }));
// audit({
//   data: [
//     `audit:server:${country}:${redis.options.host}`,
//     pj({ port, password, showFriendlyErrorStack }),
//   ],
//   ttlm: 10,
// });
// };

/**
 * `execute()` takes a context object and adds it to a stream.
    crd provides the function to execute.
    context provides the runtime data.
 */
const execute = ({ crd, context }) =>
  new Promise((resolve, reject) => {
    if (isEmpty(context)) {
      return reject('Context cannot be empty');
    }

    // console.warn(
    //   '====================================================================='
    // );
    // console.warn('For memoization purposes, execute() used this data:');
    // console.warn('crd :>> ', crd);
    // console.warn('context :>> ', pj(context));
    // console.warn(
    //   '====================================================================='
    // );

    const { key, value, path } = context;

    const { preamble, owner, hash, id } = key;
    // getHost(preamble.slice(4, 6));
    //     console.log(
    //       headingColor(`
    // ----------------------------------------------------------------------
    // Processing request
    // redis.host: ${redis.options.host}
    // ----------------------------------------------------------------------
    // `)
    // );

    const getKey = () => `${preamble}${getOwner()}${getHash()}${getID()}`;
    const getOwner = () => (owner ? `:${owner}` : '');
    const getHash = () => (hash ? `:${hash}` : '');
    const getID = () => (id ? `:${id}` : '');

    const KEY = getKey();
    const VALUE = value;
    const PATH = path ? `$.${path}` : '.';

    const getHashWithPath = (path) => {
      // const crd = 'getHash';
      // const context = { key, path };
      // return execute({ crd, context });
      const cmd = [KEY, path];
      return redis
        .hget(cmd)
        .then((string) => {
          return string;
        })
        .catch((e) => reject(e));
    };

    // SET and GET using Redis Hash Table
    const hashGet = () => {
      const cmd = [KEY, path];
      url(`hashGet().cmd :>>`);
      headingColor(`HGET ${KEY} ${path} `);

      return redis
        .hget(cmd)
        .then((string) => {
          return string;
        })
        .catch((e) => reject(e));
    };

    // code in TQR repo used a different hashSet
    // this one is optimized for Topics
    const hashSet = () => {
      const { editor, content, authors } = value;
      const cmd = [KEY, editor, content, 'authors', authors];
      url(`hashSet().cmd :>>`);
      console.log(`HSET ${KEY} ${editor} ${content} authors "${authors}"`);
      //             ---------------key-------------- editor content
      // return HSET 19:tensor:topics:1724286327491-0 main <p>new content</p>
      // where editor=main
      // HSET ${KEY} editor ${editor} content ${content} authors "${authors}""`
      return redis
        .hset(cmd)
        .then((result) => {
          console.log('hashSet() added :>> ', result);
          return { result, KEY };
        })
        .catch((e) => {
          console.error(`hashSet() error ${e.message}`);
          throw e; // Make sure to throw the error to propagate it correctly
        });
    };

    const hashSet2 = () => {
      const { title, summary, authors, main, aside } = value;
      const cmd = [KEY, value];

      url(`hashSet2().cmd :>>`);
      console.log(
        `HSET ${KEY} title '${title}' summary '${summary}' authors ${head(
          authors
        )} main '${main}' aside '${aside}'`
      );
      return redis
        .hset(cmd)
        .then((result) => {
          console.log('hashSet2() added :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };

    // handling authors

    // const updateAuthors = () => {
    //   const key = `${KEY}:authors`;
    //   console.log('author :>> ', value);
    //   // > rpush 19:tensor:topics:favorites:1721028100821-0 topic 1726874317161-0
    //   url(`updateAuthors().cmd :>>`);
    //  redis.lpos(key, value).then((exists) => {
    //     if (exists === null) {
    //       console.log(`RPUSH ${key} ${value}`);
    //       return redis
    //         .rpush(key, value)
    //         .then((result) => {
    //           console.log('appended to array :>> ', result);
    //           return { result, key };
    //         })
    //         .catch((e) => reject(e.message));
    //     } else {
    //       console.log(`LSET ${key} ${value}`);
    //       return redis
    //         .lset(key, 0, value)
    //         .then((result) => {
    //           console.log('updated lead author :>> ', result);
    //           return { result, KEY };
    //         })
    //         .catch((e) => reject(e.message));
    //     }
    //   });
    // const addAuthor = () => {
    //   const author = VALUE;
    //   const path = 'authors';
    //   hashGet(path).then((hash) => setHashArrayField(path, hash, author));
    // };

    // const removeAuthor = () => {
    //   const path = 'authors';
    //   const author = VALUE;
    //   return hashGet('authors').then((hash) => {
    //     const remainingAuthors = hash.split(' ').filter((v) => v != author);
    //     jl3('remainingAuthors', remainingAuthors);
    //     updateHashArrayField(path, remainingAuthors);
    //   });
    // };
    // const setHashArrayField = (path, hash) => {
    //   if (hash?.split(' ').includes(VALUE)) {
    //     return;
    //   }

    //   const value = {};
    //   const pathValue = hash ? `${hash} ${VALUE}` : VALUE;
    //   value[path] = pathValue;

    //   const cmd = [KEY, value];
    //   headingColor(`HSET ${KEY} ${pj(value)} `);

    //   return redis
    //     .hset(cmd)
    //     .then((string) => {
    //       return string;
    //     })
    //     .catch((e) => reject(e));
    // };

    // const updateHashArrayField = (path, hash) => {
    //   const value = {};
    //   value[path] = hash;

    //   const cmd = [KEY, value];
    //   headingColor(`HSET ${KEY} ${pj(value)} `);

    //   return redis
    //     .hset(cmd)
    //     .then((string) => {
    //       return string;
    //     })
    //     .catch((e) => reject(e));
    // };

    //   // > rpush 19:tensor:topics:1726874317161-0:authors
    //              ----------------------------------------
    //                          ^
    const topicAuthorsKey = `${KEY}:authors`;
    const authorPk = value;

    // Helper function to check if an author exists in the list
    function authorExists(authorPk) {
      return redis
        .lpos(topicAuthorsKey, authorPk)
        .then((position) => position !== null);
    }

    // Add an author to the list, if not already present
    function addAuthor() {
      return authorExists(authorPk).then((exists) => {
        if (!exists) {
          return redis
            .rpush(topicAuthorsKey, authorPk)
            .then(() => console.log(`Author ${authorPk} added to topic.`));
        } else {
          console.log(`Author ${authorPk} already exists in topic.`);
        }
      });
    }

    // Remove an author from the list
    function removeAuthor() {
      return redis.lrem(topicAuthorsKey, 0, authorPk).then((removed) => {
        if (removed > 0) {
          console.log(`Author ${authorPk} removed from topic.`);
        } else {
          console.log(`Author ${authorPk} not found in topic.`);
        }
      });
    }

    // Transfer lead status (replace the first author with a new one)
    function replaceLead(authorPk) {
      return redis.lindex(topicAuthorsKey, 0).then((leadPk) => {
        if (leadPk) {
          return authorExists(authorPk).then((exists) => {
            if (exists) {
              // Use LSET to update the first position (lead)
              return redis
                .lset(topicAuthorsKey, 0, authorPk)
                .then(() =>
                  console.log(`Lead changed to ${authorPk} for topic.`)
                );
            } else {
              // Use LPOP to remove current lead, LPUSH to add the new lead at the front
              return redis
                .lpop(topicAuthorsKey)
                .then(() => redis.lpush(topicAuthorsKey, authorPk))
                .then(() =>
                  console.log(`New lead ${authorPk} added to topic.`)
                );
            }
          });
        } else {
          console.log(`No lead found for topic.`);
        }
      });
    }

    // Transfer lead and keep old lead as a regular author
    function transferLead() {
      return redis.lindex(topicAuthorsKey, 0).then((currentLeadPk) => {
        if (currentLeadPk) {
          // Ensure the new lead is not already in the list further down
          return redis
            .lrem(topicAuthorsKey, 0, authorPk) // Remove any instance of the new lead from the list
            .then((removedCount) => {
              if (removedCount > 0) {
                console.log(
                  `Removed ${authorPk} from its old position in authors.`
                );
              } else {
                console.log(`${authorPk} was not present in the list.`);
              }

              // Push the new lead to the front of the list
              return redis.lpush(topicAuthorsKey, authorPk).then(() => {
                console.log(`Lead transferred to ${authorPk} for topic.`);
              });
            });
        } else {
          console.log(`No lead found for topic.`);
        }
      });
    }

    // end authors

    // handling Favorites
    const addToSet = () => {
      // > rpush 19:tensor:topics:favorites:1721028100821-0 topic 1726874317161-0
      url(`addToSet().cmd :>>`);
      console.log(`SADD ${KEY} ${value}`);
      return redis
        .sadd(KEY, value)
        .then((result) => {
          console.log('added to Set :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };
    const getArray = () => {
      url(`getArray().cmd :>>`);
      console.log(`LRANGE ${KEY} 0, 1`);
      return redis
        .lrange(KEY, 0, 1)
        .then((result) => {
          console.log('RETURN array :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };

    const getFavorites = () => {
      url(`getFavorites().cmd :>>`);
      console.log(`SMEMBERS ${KEY} `);
      return redis
        .smembers(KEY)
        .then((result) => {
          console.log('Returned  favorites :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };

    const deleteFavorite = () => {
      url(`deleteFavorite().cmd :>>`);
      console.log(`SREM ${KEY} ${value}`);
      return redis
        .srem(KEY, value)
        .then((result) => {
          console.log('Deleted favorite :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };
    // end of Favorites handlers

    const publishToRedis = (key = KEY, value = VALUE) => {
      jl3('publishToRedis', { key, value });
      const message = JSON.stringify(value);
      return redisPub.publish(key, message);
    };

    const getPatches = () => {
      console.log('getPatches', KEY, value);
      return redis
        .hget(KEY, 'patch')
        .then((result) => {
          console.log('getPatches() added :>> ', result);
          return { result, KEY };
        })
        .catch((e) => {
          console.error(e.message);
          throw e; // Make sure to throw the error to propagate it correctly
        });
    };

    const savePatch = () => {
      console.log('savePatch', KEY, value);
      return redis
        .hset([KEY, 'patch', value])
        .then((result) => {
          console.log('savePatch() added :>> ', result);
          return { result, KEY };
        })
        .catch((e) => {
          console.error(e.message);
          throw e; // Make sure to throw the error to propagate it correctly
        });
    };

    const saveContentHash = () => {
      return publishToRedis(KEY, value)
        .then(() => hashSet())
        .catch((e) => console.error(e));
    };

    const saveContent = () => {
      jl('saveContent()', { KEY, value });
      // parameterize this
      const hash = true;
      if (hash) {
        saveContentHash();
      } else {
        saveContentJson();
      }
    };

    const addTopic = () => {
      // uses minimal data; viz., title, summary, and authors
      jl3('value', value);
      return publishToRedis(KEY, value).then(() => hashSet2());
    };

    const updateTopic = () => {
      // uses minimal data; viz., title, summary, and authors
      jl3('value', value);
      return publishToRedis(KEY, value).then(() => hashSet2());
    };

    const addTemplate = () => {
      // Template has its own hash
      jl3('value', value);
      return publishToRedis(KEY, value).then(() => hashSet2());
    };
    const updateTemplate = () => {
      // Template has its own hash
      jl3('value', value);
      return publishToRedis(KEY, value).then(() => hashSet2());
    };

    const removeDocument = () => {
      // Template has its own hash

      console.log('removetemplate() removing template :>> ', KEY, VALUE);

      redis
        .xdel(KEY, VALUE)
        .then((result) => {
          console.log('removeDocument() xdel result :>> ', result);
        })
        .catch((error) => {
          console.error('removeDocument() xdel error :>> ', error);
        });
      redis
        .del(`${KEY}:${VALUE}`)
        .then((result) => {
          console.log('removeDocument() del result :>> ', result);
        })
        .catch((error) => {
          console.error('removeDocument() del error :>> ', error);
        });
    };

    const findTopics = () => {
      let cursor = '0';
      let matchingHashKeys = [];
      const pattern = `${key.preamble}:*`;
      const searchKey = value;
      function scanNext() {
        return redis
          .scan(cursor, 'MATCH', pattern)
          .then((result) => {
            cursor = result[0];
            const keys = result[1];

            const keyChecks = keys.map((key) => {
              return redis.type(key).then((type) => {
                if (type === 'hash') {
                  return redis.hget(key, 'authors').then((authors) => {
                    if (!authors) {
                      return;
                    } else if (
                      authors === searchKey ||
                      authors.split(' ').includes(searchKey)
                    ) {
                      matchingHashKeys.push(key);
                    }
                  });
                }
              });
            });

            return Promise.all(keyChecks);
          })
          .then(() => {
            if (cursor !== '0') {
              return scanNext();
            }
          })
          .catch((e) => {
            console.log('e :>> ', e);
          });
      }

      return scanNext().then(() => matchingHashKeys);
    };
    const scanHashKeys = () => {
      let cursor = '0';
      let matchingKeys = [];
      const pattern = `${KEY}:${value}`;

      function scanNext() {
        return redis
          .scan(cursor, 'MATCH', pattern, 'TYPE', 'HASH')
          .then((result) => {
            cursor = result[0];
            const keys = result[1];
            matchingKeys = matchingKeys.concat(keys);

            if (cursor !== '0') {
              return scanNext();
            }
          })
          .catch((e) => {
            console.log('Error during scan:', e);
          });
      }

      return scanNext().then(() => matchingKeys);
    };

    const scanHash = () => {
      headingColor('scanStreams');
      console.log('Incoming key:', pj(key));
      headingColor(`Redis command:`);
      url(`SCAN 0 MATCH ${KEY} COUNT 200 `);

      if (KEY.includes('oops')) {
        console.error('Invalid real time input');
        console.error(KEY);
      }

      return (
        redis
          .hscan([KEY, 0])
          // .hscan([KEY, 0, 'MATCH', '*', 'COUNT', 2000])
          .catch((err) => console.error('Error while getting redis keys:', err))
      );
    };

    const appendHashArray = () => {
      jl3('args', { KEY, id, path, value });
      hashGet().then((array) => {
        jl3('array', array);
      });
    };

    const hashMGet = () => {
      // HMGET myhash field1 field2 nofield
      const { query } = VALUE;
      console.log('hashMGet() query', query);
      if (isEmpty(query)) {
        return scanHash();
      }
      const cmd = [KEY, ...query];
      // const cmd = [KEY, VALUE];
      url(`hashMGet().cmd :>>`);
      url(`HMGET ${cmd}`);

      return redis
        .hmget(cmd)
        .then((string) => {
          console.log('GETTED hash value :>> ', string);
          return string;
        })
        .catch((e) => {
          reject(e.message);
        });
    };

    // redis docs say hmset is deprecated

    const hashMSet = () => {
      const { query } = VALUE;
      // HMSET key field value [field value ...]
      const cmd = [KEY, ...query];
      url(`hashMSet().cmd :>>`);
      url(`HMSET ${cmd}`);

      return redis
        .hmset(cmd)
        .then((result) => {
          console.log('fields added :>> ', result);
          return { result, KEY };
        })
        .catch((e) => reject(e.message));
    };
    //#endregion

    const get = () => {
      // GET 'tqr.lo.vcf:1677893265475-0:Default Card'

      return redis
        .json_get(KEY)
        .then((string) => {
          console.log('KEY :>> ', KEY);
          console.log('set() returns :>> ', string);
          return { key: KEY, string };
        })
        .catch((e) => reject(e.message));
    };
    const set = () => {
      // SET 'tqr.lo.vcf:1677893265475-0:Default Card' [some vcf string]

      return redis
        .json_set(KEY, value)
        .then((string) => {
          console.log('KEY :>> ', KEY);
          console.log('set() added :>> ', string);
          return { key: KEY, string };
        })
        .catch((e) => reject(e.message));
    };

    //#region JSON
    const jsonSet = () => {
      // JSON.SET tqr.lo.mpc@reward@withEarnURL $ '{"html":"<h6>test</h6>test content","earnRewardUrl":"https://tqrtoken.com","burnRewardUrl":"https://tqrtoken.com"}'
      // console.clear();
      // console.warn(KEY, '=>', pj(value));
      console.warn('\nAUDIT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
      console.warn('AUDIT jsonSet()');
      console.warn('AUDIT KEY', KEY);
      console.warn('AUDIT value', pj(value));
      return redis
        .json_set(KEY, '.', value)
        .then((result) => {
          console.warn('json added :>> ', result);
          console.warn('AUDIT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
          return result;
        })
        .catch((e) => {
          console.error(e);
          return e.message;
        });
    };

    const saveContentJson = () => {
      const content = JSON.stringify({ editor: path, content: value });
      jl('saveContentJson().content', content);
      return publishToRedis(KEY, content).then(() => jsonSetWithPath());
    };

    const typing = () => {
      return publishToRedis(KEY, value)
        .then(() => Promise.resolve('published event'))
        .catch((e) => reject(e));
    };

    const jsonSet2 = () => {
      // JSON.SET tqr.lo.mpc@reward@withEarnURL $ '{"html":"<h6>test</h6>test content","earnRewardUrl":"https://tqrtoken.com","burnRewardUrl":"https://tqrtoken.com"}'

      // if context value is a map, it will have a size, so expand it
      // else it's an array or object
      const val = value.size ? [...value] : value;

      console.warn(KEY, '=>', pj(val));
      return redis
        .json_set(KEY, '.', val)
        .then((result) => {
          console.log('json added :>> ', result);
          return result;
        })
        .catch((e) => {
          reject(e.message);
        });
    };

    const jsonGet = () => {
      // JSON.GET tqr.lo.mpc@reward@withEarnURL '.'

      return redis
        .json_get(KEY, PATH)
        .then((json) => {
          // TODO pri2/sev2 why default to empty array?
          const results = json ?? [];
          passedColor('KEY :>> ', KEY);
          passedColor('jsonGet() returns json :>> ', pj(results));
          return results;
        })
        .catch((e) => {
          reject(e.message);
        });
    };

    const jsonGet2 = () => {
      // JSON.GET tqr.lo.mpc@reward@withEarnURL '.'

      return redis
        .json_get(KEY, '.')
        .then((json) => {
          passedColor('KEY :>> ', KEY);
          if (json.size) {
            passedColor('jsonGet() returns json :>> ', json);
          } else {
            console.warn('jsonGet2() returns NO json');
          }
          return { key: KEY, json };
        })
        .catch((e) => reject(e.message));
    };
    const jsonGetWithPath = () => {
      jl('jsonGetWithPath', { KEY, path });
      return redis
        .json_get(KEY, path)
        .then((json) => {
          jl('JSON :>> ', json);

          return { key: KEY, json };
        })
        .catch((e) => {
          reject(e.message);
        });
    };
    const jsonSetWithPath = () => {
      jl('jsonSetWithPath', { KEY, path });
      return redis
        .json_set(KEY, path, VALUE)
        .then((json) => {
          jl('JSON :>> ', json);
          return { key: KEY, json };
        })
        .catch((e) => {
          reject(e.message);
        });
    };

    const jsonAppendWithPath = () => {
      jl('jsonAppendWithPath', { KEY, path, VALUE });
      // first ensure we have a topics json node
      return redis.type(KEY, path).then((ok) => {
        if (ok) {
          return redis
            .json_arrappend(KEY, path, VALUE)
            .then((json) => {
              jl('JSON :>> ', json);
              return { key: KEY, json };
            })
            .catch((e) => {
              reject(e.message);
            });
        } else {
          redis.json_set(KEY, path, []).then((ok) => {
            if (ok) {
              redis.json_arrappend(KEY, '.topics', VALUE);
            } else {
              console.warn('Cannot append with ', KEY, path, VALUE);
            }
          });
        }
      });
    };

    // is this function still necessary if we never dereference topics in vCards?
    const trimTopic = () => {
      // trimTopic  :>>  {
      //   "KEY": "19:tensor:vcards",
      //   "path": ".topics",
      //   "VALUE": "1723231617601-0"
      // }
      jl('trimTopic', { KEY, path, VALUE });
      return jsonGetWithPath().then((results) => {
        const topics = results.json;
        const removeTopicAt = topics.indexOf(value);
        topics.splice(removeTopicAt, 1);
        pj('remainingTopics', topics);
        return redis
          .json_set(KEY, path, topics)
          .then(() => {
            return jsonGetWithPath();
          })
          .catch((e) => {
            reject(e.message);
          });
      });
    };

    //#endregion JSON

    //CREATE
    /**
     * `addStream()` takes a context object and adds it to a stream
     * @returns The return value is the stream ID of the new entry.
     */
    const addStream = () => {
      console.warn('\nAUDIT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');

      const cmd = [KEY, '*', VALUE];
      url(`AUDIT addStream().cmd :>>`);
      url(`AUDIT XADD ${KEY} `);
      url(`AUDIT XADD ${pj(cmd)} `);

      if (KEY.endsWith('messages') || KEY.endsWith('private')) {
        console.warn(KEY);
        console.warn(pj(value));
        redisPub.publish(KEY, JSON.stringify(value));
      }
      return redis
        .xadd(cmd)
        .then((newSid) => {
          console.log('newSid :>> ', newSid);
          console.warn('AUDIT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n');
          return newSid;
        })
        .catch((e) => e);
    };

    //tqr:xx:1659059618220-0:connections:mpc@dbg@220
    // READ
    const scanStreams = () => {
      headingColor('AEgisTqr.scanStreams()');
      console.log('Incoming key:', pj(key));
      headingColor(`Redis command:`);

      console.log(' ');
      url(`SCAN 0 MATCH ${KEY} COUNT 5000`);
      console.log(' ');

      if (KEY.includes('oops')) {
        console.error('Invalid real time input');
        console.error(KEY);
      }
      const keysArray = [];

      let stream = redis.scanStream({
        match: KEY,
        // TODO we need to scan for JSON, too
        type: 'STREAM',
        count: 5000,
      });
      return new Promise((res) => {
        stream.on('data', async (keys = []) => {
          let k;
          for (k of keys) {
            if (!keysArray.includes(k)) {
              await keysArray.push(k);
            }
          }
        });
        stream.on('end', () => {
          // console.log(JSON.stringify(keysArray, null, 2));
          res(keysArray);
        });
      }).catch((err) => console.error('Error while getting redis keys:', err));
    };
    // const scanStreams = () => {
    //   headingColor('scanStreams'));
    //   console.log('Incoming key:', pj(key));
    //   headingColor(`Redis command:`));
    //   url(`SCAN 0 MATCH ${KEY} COUNT 2000`));

    //   if (KEY.includes('oops')) {
    //     console.error('Invalid real time input');
    //     console.error(KEY);
    //   }
    //   const keysArray = [];

    //   let stream = redis.scanStream({
    //     match: KEY, count:2000
    //   });
    //   return new Promise((res) => {
    //     stream.on('data', async (keys = []) => {
    //       let k;
    //       for (k of keys) {
    //         if (!keysArray.includes(k)) {
    //           await keysArray.push(k);
    //         }
    //       }
    //     });
    //     stream.on('end', () => {
    //       console.log(JSON.stringify(keysArray, null, 2));
    //       // owner and id are top-level constants
    //       // owner triggers getStream for Tokens
    //       // id triggers getStream for Connections
    //       if (id || owner) {
    //         const promises = keysArray.map((v) => {
    //           console.warn('KeysArray item', v);
    //           return getStream(v);
    //         });
    //         Promise.all(promises).then((results) => {
    //           headingColor('Promises'));
    //           console.log(
    //             'results of promises:',
    //             JSON.stringify(results.flat(2), null, 2)
    //           );

    //           ;
    //           console.log(' ');
    //           res(results);
    //         });
    //       } else {
    //         res(keysArray);
    //       }
    //     });
    //   }).catch((err) => console.error('Error while getting redis keys:', err));
    // };

    /**
   * @param [keyToGet] - the KEY to get the stream from
   * @param [payloadToGet] - { start: '-', end: '+', count: 1 }
   * @returns A promise that resolves to an object.
   // if start/end are the same integer, get that single entry (e.g., XRANGE tqr:us:mpc@test#events  1654108813437 1654108813437)
   // if start/end are different timestamps, get entries between the dates  (e.g., XRANGE tqr:us:mpc@test#events  1654108399436 1654108813437)
   // if start='-' and end = '+' COUNT 1 get the first entry using XRANGE (e.g, XRANGE tqr:us:mpc@test#events - + COUNT 1)
   // if start='+' and end = '-' COUNT 1 get the last entry using XREVRANGE (XREVRANGE tqr:us:mpc@test#events  + - COUNT 1)
   // if start='-' and end= "+" get all entries
   // we can iterate a stream by prefixing the subsequent beginning IDs with a '(' character
   // we can iterate the entire stream using end character, '+', or a section of the stream by using an integer end value
   */
    const getStream = (keyToGet = KEY, payloadToGet = VALUE) => {
      const { start = '-', end = '+', count } = payloadToGet;
      const cmd = count
        ? [keyToGet, start, end, 'COUNT', count]
        : [keyToGet, start, end];
      if (cmd[0] === 'tqr:sg:Magmarvel@TomahawkKing:tokens:1663484650478-0') {
        console.log(' ');
      }
      const cmdString = cmd.join(' ');
      url(`getStream().cmd :>> `);
      url(`XRANGE ${cmdString}`);

      if (end === '-')
        return (
          redis
            .xrevrange(cmd)
            // wrap everything in arrays so we can use data in Map object
            .then((stream) => {
              return [[KEY], [...stream]];
            })
            .catch((e) => {
              return reject(e);
            })
        );
      return (
        redis
          .xrange(cmd)
          // to use a Map, we need an array of arrays
          // and the inner array will have one element
          // for connections, but n elements for tokens
          .then((stream) => {
            if (!isEmpty(stream)) {
              passedColor('XRANGE result');
              passedColor('keyToGet :>> ', keyToGet);
              passedColor('stream :>> ', pj(stream));

              // sort by Date Descending
              const sortedStream = stream.sort(
                (a, b) => b.id.slice(0, 13) - a.id.slice(0, 13)
              );

              return [keyToGet, sortedStream];
            }
          })
          .catch((e) => reject(e.message))
      );
    };

    const getFirstFromStream = () => getStream(KEY, { count: 1 });
    const getLastFromStream = () =>
      getStream(KEY, { start: '+', end: '-', count: 1 });

    // DELETE
    // Not sure why I would delete more than one ID
    // const deleteStream = (keyToDelete = KEY, payloadToDelete = VALUE.ids) =>
    const deleteStream = (keyToDelete = KEY, payloadToDelete = VALUE) => {
      console.warn(keyToDelete, payloadToDelete);
      return redis
        .xdel(keyToDelete, payloadToDelete)
        .then((deleted) => {
          console.log('deleted :>> ', deleted);
          return deleted;
        })
        .catch((e) => {
          return reject(e);
        });
    };
    const archiveStream = () => {
      url(`archiveStream().cmd :>> `);
      url(`RENAME ${KEY} archive-${KEY}`);
      redis.rename(KEY, `archive-${KEY}`).catch((e) => unpackError(e));
    };

    const restoreStream = () => redis.rename(`${KEY}${id}`, KEY);

    // called with 'push' crd
    const listPush = () => {
      console.log(pj(value));
      return redis.lpush(KEY, value);
    };

    // linksMap

    const jsonGetMap = () => {
      return (
        redis
          // we can't query arrays, so use full path...
          .json_get(KEY, '.')
          .then((json) => {
            passedColor('KEY :>> ', KEY);
            passedColor('jsonGetMap() returns json :>> ', pj(json));
            // ...now use the path arg to find the key
            const tensor = json?.filter((v) => path.includes(v.id));
            return tensor ?? [];
          })
          .catch((e) => {
            reject(e.message);
          })
      );
    };

    const jsonSetTensor = () => {
      console.log('jsonSetTensor() key/value :>>', KEY, pj(value));
      redisPub.publish(KEY, JSON.stringify(value));

      // PATH will add leading characters to path passed in
      const Path = PATH ?? '.';
      return redis
        .json_set(KEY, Path, value)
        .then((result) => {
          console.log('json added :>> ', result);
          return result;
        })
        .catch((e) => reject(e.message));
    };

    // called with 'list' crd
    const exists = () => {
      console.log('KEY :>> ', KEY);
      return redis.exists(KEY).then((answer) => {
        const returnKey = answer === 1 ? key : null;
        jl('returnkey', returnKey);
        return returnKey;
      });
    };
    const listRange = () => {
      // console.log('value :>> ', value);
      const { start, end } = value;
      return redis.lrange(KEY, start, end);
    };
    const pkStreamMap = () => {
      return getStream().then((pk) => {
        if (isEmpty(pk)) {
          console.error(`pk is empty based on KEY ${KEY} VALUE ${VALUE}`);
          return [];
        }
        jl('pk', pk);
        return [...pk];
      });
    };

    const tensorMapJoin = () => {
      const map = new Map();
      const key = `${preamble}:vcards:${owner}`;
      // if value it is My Tensor, use it in setTensor() below.
      console.warn('tensorMapJoin() for VID:', key);

      const getVcard = () =>
        redis.json_get(key, '.').then((json) => map.set(key, json));

      function getMyTensor(id) {
        const key = `${preamble}:links:${id}`;
        return redis
          .json_get(key, '.')
          .then((json) => map.set('myTensor', json));
      }

      // called by getTheirTensors()
      function getTheirLinks(tensor) {
        const key = `${preamble}:links:${tensor.id}`;
        return redis.json_get(key, '.');
      }

      function getTheirTensors(tensors) {
        if (!tensors) {
          console.warn('No tensors to fetch');
          map.set('theirTensors', []);
          return;
        }
        return Promise.all(tensors.map(getTheirLinks)).then((json) =>
          map.set('theirTensors', json)
        );
      }

      function getTheirSelectedTensor() {
        const tensors = map.get('theirTensors');
        return tensors.reduce((a, c) => {
          if (!a) {
            console.log(c);
            const foundTensor = c.vectors.find((tensor) => tensor.id === owner);
            if (foundTensor) {
              return c;
            }
          }
          return a;
        }, null);
      }

      function getTopics() {
        return [...map];
      }

      function setTensor() {
        const selectedTensor = value?.id ? value : getTheirSelectedTensor();
        console.warn('tensorMapJoin() selectedTensor:', selectedTensor);

        map.set('selectedTensor', selectedTensor);
        jl('tensorMapJoin() returns map:', [...map]);
        console.log();
      }

      return getVcard()
        .then(() => getMyTensor(map.get(key)?.id))
        .then(() => getTheirTensors(map.get(key)?.tensors))
        .then(() => setTensor())
        .then(() => getTopics());
    };

    // Goal: One vcard is a Tensor (perhaps for the first time); the other a Vector.
    // Two keys get updated:
    //    the tensor:links key for the Tensor
    //    and the tensor:vcards key for the Vector
    //
    // The Tensor will appear in the tensor:links key identified by its VID.id,
    // and the Tensor's vectors array will include the Vector's id and label.
    //
    // In the Vector's vcard, the tensors array will include the Tensor's id and label.
    const link = () => {
      // TODO experiment with a simpler version using Promise.all()
      const linkID = value;
      const map = new Map();
      const vectorKey = `${preamble}:vcards:${owner}`;
      const tensorKey = `${preamble}:links:${linkID}`;

      jl('vectorKey:', vectorKey);
      jl('tensorKey:', tensorKey);

      //#region Detail functions
      // may be called by getTensor
      function needsTensor() {
        const tensor = (vcard) => {
          if (!vcard) {
            return;
          }
          const { id, label } = vcard;
          return {
            id,
            label,
            action: 'mdi-view-dashboard-outline',
            vectors: [
              {
                id,
                label,
                action: 'mdi-view-dashboard-outline',
              },
            ],
          };
        };

        console.log('AUDIT Creating tensorkey JSON :>> ', tensorKey);
        // use the linkID field to get the vcard of the Tensor
        const key = `${preamble}:vcards:${linkID}`;
        return (
          redis
            // get the Vid for the new Tensor
            .json_get(key, '.')
            // make the json for the new Tensor
            .then((vcard) => {
              const { id, label } = vcard;
              return {
                id,
                label,
                action: 'mdi-star-outline',
                vectors: [
                  {
                    id,
                    label,
                    action: 'mdi-star-outline',
                  },
                ],
              };
            })
            .then((tensor) => {
              redis.json_set(tensorKey, '.', tensor);
              jl('tensor', tensor);
              map.set('tensor', tensor);
              map.set('tensorVectors', tensor.vectors);
              return tensor;
            })
            .catch((e) => {
              const cause = 'unknown';
              const error = {
                source: 'REDIS ERROR: link().needsTensor() returned error:',
                error: e.message,
                cause,
                context: { tensorKey, vectorKey, tensor },
              };
              jl('error', error);

              return error;
            })
        );
      }

      // sets the vid as vector for the Tensor
      const getVector = () =>
        redis
          .json_get(vectorKey, '.')
          .then((json) => {
            jl('link().getVector().vector', json, tokenColor);
            // ensure we haven't previously added this Tensor to the vid's tensors array
            const here = json.tensors.find((v) => v.id === linkID);
            if (!here) {
              jl('getVector(): adding vector', linkID);
              // we have a valid new vector to add to the Tensor
              map.set('vector', json);
              // we update Vector's tensors array later
            }
          })
          .catch((e) => {
            const msg = `link().getVector() returned error ${e.message}`;
            console.error(msg);
            return { error: msg, context: { tensorKey, vectorKey } };
          });

      function getTensorVectors() {
        jl('link().getTensorVectors() tensorKey :>> ', tensorKey);
        return redis.exists(tensorKey).then((yes) => {
          if (yes) {
            jl('tensorKey exists', tensorKey);

            return redis
              .json_get(tensorKey, '.')
              .then((tensor) => {
                map.set('tensor', tensor);
                map.set('tensorVectors', tensor.vectors);
                return tensor;
              })
              .catch((e) => {
                const msg = `link().getTensor() returned error ${e.message}`;
                console.error(msg);
                return { error: msg, context: { tensorKey, vectorKey } };
              });
          } else {
            console.log(
              'AUDIT link().getTensorVectors() calling needsTensor()'
            );
            return needsTensor();
          }
        });
      }

      function updateTensorVectors() {
        logMap2(
          map,
          0,
          clc.yellow,
          'AUDIT link().updateTensorVectors() returns map:'
        );
        const tensorVectors = map.get('tensorVectors');
        // ensure Tensor's vectors array does not contain vcard
        const here = tensorVectors?.find((v) => v.id === owner);
        /*                                                  |
          Example of error :   v
          18/1/2024 0:17:0.743   AUDIT:  link().updateTensorVectors() returned error {
            "tensorKey": "19:tensor:links:1705286000108-0",
            "vectorKey": "19:tensor:vcards:undefined",   <=====================
            "id": "1705286000108-0",
            "label": "Mpc"
          }
        */
        if (!here && tensorKey) {
          const { id, label } = head(tensorVectors);
          jl(`link().updateTensorVectors() adding to ${tensorKey} vector`, {
            id,
            label,
          });
          const vector = map.get('vector');
          return redis
            .json_arrappend(tensorKey, 'vectors', vector)
            .then(() => {
              redis.json_arrappend(vectorKey, 'tensors', { id, label });
              const audit = { vectorKey, tensorKey, id, label };
              jl('link().updateTensorVectors() appended', audit);

              return Array.from(map);
            })
            .catch((e) => {
              const audit = { tensorKey, vectorKey, vector, id, label };
              jl('link().updateTensorVectors() returned error', audit);
              const msg = `link().updateTensorVectors() returned error ${e.message}`;
              console.error(msg);
              return { error: msg, context: { tensorKey, vectorKey } };
            });
        }
        jl('updateTensorVectors() cannot duplicate ', owner);
        return 0;
      }

      //#endregion

      // Primary code path
      // first get the vid that will be the Vector for the Tensor
      return getVector()
        .then(() => getTensorVectors())
        .then(() => updateTensorVectors())
        .then(() => {
          // const keyParts = KEY.split(':');
          // const key = keyParts[0] + ':' + keyParts[1] + 'links' + value;
          // jl('LINK()  key :>>', key);
          jl('LINK()  tensorKey', tensorKey);
          const tvs = map.get('tensorVectors');
          const vs = map.get('vector');
          jl('LINK()  map.get(tensorVectors)', tvs);
          jl('LINK()  map.get(vector)', vs);
          tvs?.push(vs);
          jl('LINK()  vectors', tvs);

          redisPub.publish(tensorKey, JSON.stringify(tvs));
        })
        .catch((e) => {
          const msg = `LINK() returned error ${e.message}`;
          console.error(msg);
          return 0;
        });
    };

    function getVidLabel() {
      // TODO Decide if taking liberties with key is OK
      // this is the only function that passes the key directly
      // all others pass the context and let KEY be the key
      jl('getVidLabel(): key', key);

      return redis
        .json_get(key, ['id', 'label', 'isOrg', 'tensors'])
        .catch((e) => e);
    }

    function getTensorVids() {
      jl('getTensorVids(): KEY', KEY);
      return redis.json_get(KEY, ['vectors']);
    }

    function getVidTensors() {
      jl('getVidTensors(): KEY', KEY);
      return redis.json_get(KEY, ['tensors']).catch(() => {
        console.log(`AEgisTqr.js  getVidTensors() ${KEY} has no tensors`);
        return `${KEY} has no tensors`;
      });
    }

    function getThisStreamRecord() {
      jl3('value', value);
      return redis.xrange(key, value, value).then((json) => {
        const report = safeParseJSON(json[0].value);
        const summary = {
          id: value,
          cause: report.cause,
          func: report.func.trim(),
          ...report.context,
        };
        jl3('summary', summary);
        return summary;
      });
    }

    function filterStreamByField() {
      const { fieldName, fieldValue } = value;
      return redis.xrange(KEY, '-', '+').then((streamEntries) => {
        const filteredEntries = streamEntries.filter((entry) => {
          return entry[fieldName] === fieldValue;
        });

        return filteredEntries;
      });
    }

    function audit() {
      const cmd = [key, '*', 'value', JSON.stringify(value.value)];
      jl3(`audit().cmd :>> ${cmd}`);
      // TODO pri1/sev2 figure out how to expire audits that are not errors
      // const ttlm = value.ttlm ?? 5;
      // const ttl = ttlm === -1 ? ttlm : 60 * ttlm; // Redis expires this key in ttl seconds
      return redis
        .xadd(cmd)
        .then((newSid) => {
          console.log('newSid :>> ', newSid);
          return newSid;
        })
        .catch((e) => e.message);
    }

    //#region EXECUTE
    /* A map of functions. */
    const match = {
      get: get,
      set: set,
      getHash: hashGet,
      setHash: hashSet,
      getMHash: hashMGet,
      setMHash: hashMSet,

      getJson: jsonGet,
      getJson2: jsonGet2,
      setJson: jsonSet,
      setJson2: jsonSet2,
      getJsonWithPath: jsonGetWithPath,
      setJsonWithPath: jsonSetWithPath,
      appendJsonWithPath: jsonAppendWithPath,

      create: addStream,
      read: getStream,
      first: getFirstFromStream,
      last: getLastFromStream,
      scan: scanStreams,
      delete: deleteStream,
      archive: archiveStream,
      restore: restoreStream,

      push: listPush,
      list: listRange,

      getMap: jsonGetMap,
      setTensor: jsonSetTensor,
      exists: exists,

      audit: audit,

      tensorMapJoin: tensorMapJoin,
      pkStreamMap: pkStreamMap,

      link: link,

      getVidLabel: getVidLabel,
      getTensorVids: getTensorVids,
      getVidTensors: getVidTensors,
      filterStreamByField: filterStreamByField,
      getThisStreamRecord: getThisStreamRecord,

      saveContent,
      typing,
      // getAllTopics, rplaced by read?
      addTopic,
      addTemplate,
      updateTopic,
      updateTemplate,
      removeDocument,
      trimTopic,
      appendHashArray,
      getHashWithPath,
      scanHash,
      findTopics,
      scanHashKeys,
      publishToRedis,

      getPatches,
      savePatch,

      getArray,
      addAuthor,
      removeAuthor,
      replaceLead,
      transferLead,

      addToSet,
      deleteFavorite,
      getFavorites,
    };

    /* Calling the async Redis function that matches the crd (create, read, delete) */
    console.warn('crd :>> ', crd);
    match[crd]()
      .then((stream) => {
        resolve(stream);
      })
      .catch((msg) => {
        console.error(msg);
        reject(msg);
      });
    //#endregion EXECUTE
  });

//#endregion

module.exports = {
  execute,
  audit,
  redisPub,
  redisSub,
  test,
  // getHost,
};

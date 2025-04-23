import redis from '../../redis/setup.js';
//#region Specialized calls

/**
 * Save Space Order to a Redis List.
 * @param {string} spaceOrderKey - Redis key for the ordered list.
 * @param {Array<string>} spaceIDs - Array of Space IDs in desired order.
 */
function saveSpaceOrder(spaceOrderKey, spaceIDs) {
  console.log(`Clearing and updating Redis list for key: ${spaceOrderKey}`);
  console.log('New order:', spaceIDs);

  return redis
    .del(spaceOrderKey) // Clear the old order
    .then(() => redis.rpush(spaceOrderKey, ...spaceIDs)) // Push the new order
    .then(() => console.log('Redis list updated successfully.'))
    .catch((err) => {
      console.error(`Error saving to Redis: ${err.message}`);
      throw err;
    });
}

/*
19:tensor:spaces:1735954146712-0:First Space:topics
   returns a SET of Topic IDs as entered

19:tensor:spaces:First Space:topics:order
   returns an ordered LIST of Topic IDs
*/
async function fetchTopics(topicOrderKey) {
  console.log('topicOrderKey :>> ', topicOrderKey);
  return redis.smembers(topicOrderKey).then((orderedTopicIds) => {
    const topicDetailsPromises = orderedTopicIds.map((id) =>
      redis.hgetall(`19:tensor:topics:content:${id}`)
    );
    return Promise.all(topicDetailsPromises);
  });
}

async function saveTopicOrder(topicOrderKey, newOrder, spaceId) {
  return redis
    .del(topicOrderKey) // Clear existing order
    .then(() => redis.rpush(topicOrderKey, ...newOrder)) // Push new order
    .then(() => console.log(`Order updated for space ${spaceId}`))
    .catch((err) => {
      console.error(`Error saving topic order for space ${spaceId}:`, err);
      throw err;
    });
}
async function persistTopicOrder({ newTopicOrder, pkTopicsKey }) {
  console.log(newTopicOrder);
  const hashData = {};
  for (const topic of newTopicOrder) {
    hashData[topic.id] = topic.title;
  }
  return redis
    .del(pkTopicsKey) // Clear existing order
    .then(() => setHash(pkTopicsKey, hashData)) // Push new order
    .catch((err) => {
      console.error(`Error saving topic order:`, err);
      throw err;
    });
}

/**
 * Retrieve Space Order from Redis List.
 * @param {string} spaceOrderKey - Redis key for the ordered list.
 * @param {string} pkSpacesKey - Redis key for the set of Space IDs.
 * @returns {Promise<Array<string>>} - Ordered list of Space IDs.
 */
async function getOrderedSpaces({  pkSpacesKey, spaceOrderKey }) {

  // if (x.length) {
    // Fetch ordered Space IDs
    const orderedIDs = await redis.lrange(spaceOrderKey, 0, -1);

    // Fetch existing Space IDs from the set
    const existingSpaces = await redis.smembers(pkSpacesKey);

    // Filter and retain only existing spaces in the order
    const orderedSpaces = orderedIDs.filter((id) =>
      existingSpaces.includes(id)
    );

    // Append any new spaces not already in the ordered list
    const unorderedSpaces = existingSpaces.filter(
      (id) => !orderedIDs.includes(id)
    );

    const finalOrder = [...orderedSpaces, ...unorderedSpaces];
    console.log(`Retrieved order for key: ${spaceOrderKey}`, finalOrder);
    return finalOrder;
  // } else {
  //   return await redis.smembers(pkSpacesKey);
  // }
}

//#endregion

// Add an entry to a Redis stream
function addToStream(streamKey, id = '*', ...fields) {
  if (!streamKey || fields.length % 2 !== 0) {
    throw new Error(
      'Invalid arguments: streamKey and fields are required, and fields must be key-value pairs.'
    );
  }

  return redis.xadd(streamKey, id, ...fields).catch((err) => {
    console.error(`Error adding to stream ${streamKey}:`, err);
    throw err;
  });
}

// Fetch all entries in a Redis stream
function getEntriesFromStream(streamKey, start = '-', end = '+') {
  return redis.xrange(streamKey, start, end).catch((err) => {
    console.error(`Error fetching entries from stream ${streamKey}:`, err);
    throw err;
  });
}

// Fetch hash content
function getHashContent(hashKey) {
  return redis.hgetall(hashKey).catch((err) => {
    console.error(`Error fetching hash content for ${hashKey}:`, err);
    throw err;
  });
}

// Set hash content
function setHash(hashKey, obj) {
  if (typeof obj !== 'object') {
    throw new Error('Invalid value: expected an object');
  }
  return redis.hmset(hashKey, obj).catch((err) => {
    console.error(`Error setting hash content for ${hashKey}:`, err);
    throw err;
  });
}

// Add a field to a hash
function setHashField(hashKey, field, value) {
  return redis.hset(hashKey, field, value).catch((err) => {
    console.error(`Error setting field ${field} in hash ${hashKey}:`, err);
    throw err;
  });
}

/**
 * Update one or more fields in a Redis hash.
 * Only the provided fields are changed; others remain untouched.
 * @param {string} hashKey - Redis hash key
 * @param {Object} updates - Field-value pairs to update
 * @returns {Promise<void>}
 */
function updateHashFields(hashKey, updates) {
  if (!hashKey || typeof updates !== 'object' || !Object.keys(updates).length) {
    throw new Error('Invalid arguments: hashKey and updates are required.')
  }

  const flatFields = []
  for (const [field, value] of Object.entries(updates)) {
    flatFields.push(field, value)
  }

  return redis.hmset(hashKey, ...flatFields)
    .catch((err) => {
      console.error(`Error updating hash ${hashKey}:`, err)
      throw err
    })
}


// Add a value to a set
function addToSet(key, value) {
  return redis.sadd(key, value).catch((err) => {
    console.error(`Error adding ${value} to SET ${key}:`, err);
    throw err;
  });
}

// Fetch members of a set
function getSetMembers(key) {
  return redis.smembers(key).catch((err) => {
    console.error(`Error fetching members of SET ${key}:`, err);
    throw err;
  });
}
// Fetch members of a set
function getOrderedList(key) {
  return redis.lrange(key, 0, -1).catch((err) => {
    console.error(`Error fetching members of SET ${key}:`, err);
    throw err;
  });
}

// Remove a value from a set or delete the key entirely
function removeFromSet(key, value) {
  console.warn('audit:  Removing', value, 'from', key);
  if (value) {
    return redis
      .srem(key, value)
      .then((ct) => {
        console.warn('Removed', ct, 'members from', key);
      })
      .catch((err) => {
        console.error(`Error removing ${value} from SET ${key}:`, err);
        throw err;
      });
  } else {
    return redis.del(key).catch((err) => {
      console.error(`Error deleting key ${key}:`, err);
      throw err;
    });
  }
}
/**
 * Remove a value from a Redis HASH or delete the entire HASH.
 * @param {string} key - The Redis HASH key.
 * @param {string} [field] - The field to remove. If not provided, deletes the entire HASH.
 * @returns {Promise<void>}
 */
function removeFromHash(key, field) {
  if (field) {
    return redis.hdel(key, field).catch((err) => {
      console.error(`Error removing field "${field}" from HASH "${key}":`, err);
      throw err;
    });
  } else {
    return redis.del(key).catch((err) => {
      console.error(`Error deleting HASH "${key}":`, err);
      throw err;
    });
  }
}
/**
 * Remove a value from a Redis LIST or delete the entire LIST.
 * @param {string} key - The Redis LIST key.
 * @param {string} [value] - The value to remove. If not provided, deletes the entire LIST.
 * @returns {Promise<void>}
 */
function removeFromList(key, value) {
  if (value) {
    return redis.lrem(key, 1, value).catch((err) => {
      console.error(`Error removing "${value}" from LIST "${key}":`, err);
      throw err;
    });
  } else {
    return redis.del(key).catch((err) => {
      console.error(`Error deleting LIST "${key}":`, err);
      throw err;
    });
  }
}

// Scan keys
function scanKeys(pattern, cursor = '0', count = 200) {
  return redis.scan(cursor, 'MATCH', pattern, 'COUNT', count).catch((err) => {
    console.error(`Error scanning keys with pattern ${pattern}:`, err);
    throw err;
  });
}

// Delete a Redis key (works for any type of key: SET, HASH, etc.)
function deleteKey(key) {
  return redis.del(key).catch((err) => {
    console.error(`Error deleting key ${key}:`, err);
    throw err;
  });
}

//#region JSON-specific commands
function jsonGet(key) {
  return redis.json_get(key).catch((err) => {
    console.error(`Error getting JSON from ${key}:`, err);
    throw err;
  });
}

function jsonSet(key, path, value) {
  return redis.json_set(key, path, value).catch((err) => {
    console.error(`Error setting JSON ${key}.${path}:`, err);
    throw err;
  });
}

function jsonAppend(key, path, value) {
  return redis.json_arrappend(key, path, value).catch((err) => {
    console.error(`Error appending JSON ${key}.${path}:`, err);
    throw err;
  });
}
//#endregion

export default {
  addToStream,
  getEntriesFromStream,
  getHashContent,
  setHash,
  setHashField,
  addToSet,
  getSetMembers,
  removeFromSet,
  removeFromHash,
  scanKeys,
  deleteKey,
  getOrderedList,

  jsonGet,
  jsonSet,
  jsonAppend,

  getOrderedSpaces,
  saveSpaceOrder,

  fetchTopics,
  saveTopicOrder,
  persistTopicOrder,

  removeFromList,
  updateHashFields,
};

// this code mediates between Redis and client code
// that manages Spaces
import RedisService from './services/redisService.js';
import { ask, tabbed } from './commands/readline.js';
import { Audit, isEmpty, pj, getTopicOrderKey } from '../utils/helpers.js';

function saveTopicOrder(spaceId, newOrder) {
  // const topicOrderKey = `19:tensor:spaces:${spaceId}:topics:order`;
  const topicOrderKey = getTopicOrderKey(spaceId);
  return RedisService.saveTopicOrder(topicOrderKey, newOrder, spaceId);
}

function fetchTopics(spaceId) {
  const topicOrderKey = getTopicOrderKey(spaceId);

  console.log('topicOrderKey :>> ', topicOrderKey);
  return RedisService.fetchTopics(topicOrderKey, spaceId);
}

function getOrderedSpaces({ spaceKey, pkSpacesKey, spaceOrderKey }) {
  return RedisService.getOrderedSpaces({
    spaceKey,
    pkSpacesKey,
    spaceOrderKey,
  });
}

function saveSpaceOrder(spaceOrderKey, spaceIDs) {
  console.log(
    'Saving space order to Redis:',
    spaceIDs,
    'for key:',
    spaceOrderKey
  );

  return RedisService.saveSpaceOrder(spaceOrderKey, spaceIDs)
    .then(() => {
      console.log(
        `Order successfully saved to Redis for key: ${spaceOrderKey}`
      );
    })
    .catch((err) => {
      console.error(`Error saving order to Redis: ${err.message}`);
      throw err;
    });
}

function fromSpace(topic, spaces, defaultFromSpace = null) {
  const availableSpaces = topic.spaces || spaces;
  if (!availableSpaces || availableSpaces.length === 0) {
    return Promise.resolve({ topic, fromSpace: null });
  }

  return ask(
    'Enter FROM Space:',
    defaultFromSpace || availableSpaces[0].spaces,
    1
  ).then((fromSpace) => {
    console.log(`\tConfirming From Space:>> ${fromSpace}`);
    return { topic, fromSpace };
  });
}

function addTopicToSpace({ toSpace, id, keysMan }) {
  const { spaceKey, pkSpacesKey, topicSpaceKey } = keysMan;
  const thisSpaceKey = `${spaceKey}:${toSpace}:topics`;
  const thisTopicSpacekey = `${topicSpaceKey}:${id}:spaces`;
  return Promise.all([
    RedisService.addToSet(pkSpacesKey, toSpace),
    RedisService.addToSet(thisSpaceKey, id),
    RedisService.addToSet(thisTopicSpacekey, toSpace),
  ])
    .then(() => ({ toSpace, id, keysMan }))
    .catch((e) => console.error(e));
}

function removeTopicFromSpace({ id, fromSpace, keysMan }) {
  const { topicSpaceKey, spaceKey } = keysMan;

  // TODO finish refactor of topic-based spaces
  const thisTopicSpacesKey = `${topicSpaceKey}:${id}:spaces`;
  const spaceTopicsKey = `${spaceKey}:${fromSpace}:topics`;
  // ui uses the ordered list to render Topics in a Space
  // so be careful to maintain referential integrity between
  // this key and spaceTopicsKey
  const spaceTopicsOrder = `space:${fromSpace}:topicOrder`;
  Audit.add({
    msg: 'spaceMan.removeTopicFromSpace()',
    thisTopicSpacesKey,
    spaceTopicsKey,
    spaceTopicsOrder,
  });
  Audit.report('Audit: spaceMan.js');

  return Promise.all([
    RedisService.removeFromSet(thisTopicSpacesKey, fromSpace),
    RedisService.removeFromSet(spaceTopicsKey, id),
    RedisService.removeFromList(spaceTopicsOrder, id),
  ]).catch((err) => {
    console.error(`Error removing topic ${id} from space ${fromSpace}:`, err);
    throw err;
  });
}

function moveTopic({ id, fromSpace, toSpace, keysMan, isClone }) {
  const promises = [];
  if (!fromSpace) {
    Audit.add({
      msg: `Topic ${id} is in the cornfield. Prompting user for a Space.`,
    });
    return Promise.resolve('Add this Topic to a Space named by the user');
  }
  if (fromSpace === toSpace) {
    return Promise.resolve('Reorder this Space');
  }
  if (fromSpace && !isClone) {
    promises.push(removeTopicFromSpace({ id, fromSpace, keysMan }));
  }

  if (toSpace) {
    promises.push(addTopicToSpace({ toSpace, id, keysMan }));
  }

  return Promise.all(promises)
    .then(() => {
      console.log(
        `Successfully moved topic ${id} from ${fromSpace || 'N/A'} to ${
          toSpace || 'N/A'
        }`
      );
      return saveTopicOrder(toSpace, [id]); // Ensure order is persisted
    })
    .catch((err) => {
      console.error(`Error during topic move operation: ${err}`);
      throw err;
    });
}

function getSpaces(pkSpacesKey) {
  return RedisService.getSetMembers(pkSpacesKey).then((spaces) => {
    return spaces;
  });
}

function displaySpaces({ pk, pkSpacesKey, topics }) {
  return getSpaces(pkSpacesKey).then((spaces) => {
    if (isEmpty(spaces)) {
      tabbed(`NOTE|   You have no Spaces, yet`);
    } else {
      console.log(`\nAuthor ${pk}'s Spaces:`);
      console.table(spaces);
    }
    return { spaces, topics };
  });
}

// called from space.js to render Space heading and Topics content
// called from server.js when opening a Space card
function getSpaceTopics({ spaceId, spaceKey, topicOrderKey, topicContentKey }) {
  const topicSetKey = `${spaceKey}:${spaceId}:topics`; // Unordered fallback key

  console.warn('Audit getSpaceTopics() using keys:');
  // 19:tensor:spaces:First Space:topics:order
  console.warn('topicOrderKey :>> ', topicOrderKey);

  // 19:tensor:spaces:1735954146712-0:First Space:topics
  console.warn('topicSetKey :>> ', topicSetKey);

  // Try fetching from the ordered list first
  return RedisService.getOrderedList(topicOrderKey)
    .then((orderedTopicIDs) => {
      if (orderedTopicIDs.length > 0) {
        console.log('Audit Ordered topic IDs for spaceId [${spaceId}]  :');
        console.table(orderedTopicIDs);
        return orderedTopicIDs;
      }

      // Fallback: Fetch from the unordered set
      console.warn(
        `Audit OOPS  No ordered topics found for spaceId [${spaceId}] -- falling back to SET key ${topicSetKey}.`
      );
      return RedisService.getSetMembers(topicSetKey);
    })
    .then((topicIDs) => {
      const promises = topicIDs.map((id) => {
        const topicKey = `${topicContentKey}:${id}`;
        return RedisService.getHashContent(topicKey).then((value) => {
          value.id = id; // Include ID in the topic object
          return value;
        });
      });
      return Promise.all(promises).then((topics) => {
        console.log(
          `Audit fetched topics for spaceId [${spaceId}] :>>`,
          pj(topics)
        );
        return topics;
      });
    })
    .catch((err) => {
      console.error(`Error querying topics for spaceId: [${spaceId}]`, err);
      throw err;
    });
}

// function getSpaceTopics({ space, spaceKey, topicContentKey }) {
//   const key = `${spaceKey}:${space}:topics`;
//   console.log('getSpaceTopics() using key :>> ', key);
//   return RedisService.getSetMembers(key)
//     .then((topicIDs) => {
//       const promises = topicIDs.map((id) => {
//         const topicKey = `${topicContentKey}:${id}`;
//         return RedisService.getHashContent(topicKey).then((value) => {
//           value.id = id;
//           return { value };
//         });
//       });
//       return Promise.all(promises).then((topics) => {
//         return topics.map((v) => v.value);
//       });
//     })
//     .catch((err) => {
//       console.error(`Error querying topics for space: ${space}`, err);
//       throw err;
//     });
// }
// function getSpaceTopics({ space, spaceKey, topicContentKey }) {
//   const key = `${spaceKey}:${space}:topics`; // Space's topics SET key
//   console.log('getSpaceTopics() using key :>> ', key);

//   return RedisService.getSetMembers(key) // Fetch topic IDs from the set
//     .then((topicIDs) => {
//       const promises = topicIDs.map((id) => {
//         const topicKey = `${topicContentKey}:${id}`; // Topic details key
//         return RedisService.getHashContent(topicKey).then((value) => {
//           value.id = id; // Include ID in the topic object
//           return value;
//         });
//       });

//       return Promise.all(promises); // Resolve all promises for topic details
//     })
//     .catch((err) => {
//       console.error(`Error querying topics for space: ${space}`, err);
//       throw err;
//     });
// }

function createSpace(spaceKey, toSpace) {
  Audit.add({ file: 'spaceMan.js', fnc: 'createSpace', toSpace });

  // Step 1: Remove Space from PK's spaces SET
  return RedisService.addToSet(spaceKey, toSpace)
    .then(() => {
      Audit.report(`Successfully created Space`);
    })
    .catch((err) => {
      console.error(`Error deleting Space: ${toSpace}`, err);
      throw err;
    });
}

function deleteSpace({ keysMan, fromSpace }) {
  const { pkSpacesKey, spaceKey, topicSpaceKey } = keysMan;
  const spaceTopicsKey = `${spaceKey}:${fromSpace}:topics`;

  // Step 1: Remove Space from PK's spaces SET
  return RedisService.removeFromSet(pkSpacesKey, fromSpace)
    .then(() =>
      // Step 2: Fetch all Topic IDs in the Space
      RedisService.getSetMembers(spaceTopicsKey)
    )
    .then((topicIDs) => {
      if (!topicIDs.length) {
        console.log(`No topics found in Space: ${fromSpace}`);
        return;
      }

      // Step 3: For each Topic, update its associations
      const promises = topicIDs.map((id) => {
        const topicSpacesKey = `${topicSpaceKey}:${id}:spaces`;
        return Promise.all([
          RedisService.removeFromSet(spaceTopicsKey, id),
          RedisService.removeFromSet(topicSpacesKey, fromSpace),
        ]);
      });

      return Promise.all(promises);
    })
    .then(() => {
      // Step 4: Delete the Space's topics SET
      return RedisService.deleteKey(spaceTopicsKey);
    })
    .then(() => {
      console.log(`Successfully deleted Space: ${fromSpace}`);
    })
    .catch((err) => {
      console.error(`Error deleting Space: ${fromSpace}`, err);
      throw err;
    });
}

// function XhandleSpaceTransformation({
//   id,
//   fromSpace,
//   toSpace,
//   keysMan,
//   isClone,
// }) {
//   const transformationActions = {
//     named_named: () => moveTopic({ id, fromSpace, toSpace, keysMan, isClone }),
//     named_blank: () => removeTopicFromSpace({ id, fromSpace, keysMan }),
//     blank_blank: () => removeTopicFromSpace({ id, keysMan }),
//     blank_named: () => addTopicToSpace({ toSpace, id, keysMan }),
//   };

//   const actionKey = `${fromSpace ? 'named' : 'blank'}_${
//     toSpace ? 'named' : 'blank'
//   }`;
//   const executeTransformation = transformationActions[actionKey];

//   if (executeTransformation) {
//     return executeTransformation();
//   } else {
//     console.warn(`Invalid transformation with key: ${actionKey}`);
//     return Promise.resolve();
//   }
// }

function handleSpaceTransformation({
  id,
  fromSpace,
  toSpace,
  keysMan,
  isClone,
  position,
}) {
  if (!id) {
    const spaceTransformations = {
      named_blank: () => deleteSpace({ fromSpace, keysMan }), // Delete Space
      blank_blank: () => deleteSpace({ fromSpace, keysMan }), // Delete Space
      named_named: () => saveSpaceOrder({ id, position, keysMan }), // Reorder
    };

    const actionKey = `${fromSpace ? 'named' : 'blank'}_${
      toSpace ? 'named' : 'blank'
    }`;
    const executeTransformation = spaceTransformations[actionKey];

    if (executeTransformation) {
      return executeTransformation();
    }
  } else {
    //assume a null type = 'topic')
    const topicTransformations = {
      named_named: () =>
        moveTopic({ id, fromSpace, toSpace, keysMan, isClone }),
      named_blank: () => removeTopicFromSpace({ id, fromSpace, keysMan }),
      blank_blank: () => addTopicToSpace({ id, keysMan }), // Add?
      blank_named: () => addTopicToSpace({ toSpace, id, keysMan }),
    };

    const actionKey = `${fromSpace ? 'named' : 'blank'}_${
      toSpace ? 'named' : 'blank'
    }`;
    const executeTransformation = topicTransformations[actionKey];

    if (executeTransformation) {
      return executeTransformation();
    }
  }

  //  console.warn(`Invalid transformation with key: ${actionKey}`);
  return Promise.resolve();
}
export default {
  createSpace,
  fromSpace,
  handleSpaceTransformation,
  addTopicToSpace,
  removeTopicFromSpace,
  moveTopic,
  displaySpaces,
  getSpaces,
  getSpaceTopics,
  deleteSpace,
  getOrderedSpaces,
  saveSpaceOrder,
  fetchTopics,
  saveTopicOrder,
};

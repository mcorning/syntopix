import topic from './redis/commands/topic.js';

import spaceMan from './redis/spaceMan.js';

import  {Audit, clj, getTopicOrderKey}  from './utils/helpers.js';

function handleReorderSpaces({ orderedIDs, spaceOrderKey }) {
  return spaceMan.saveSpaceOrder(spaceOrderKey, orderedIDs);
}

async function fetchAndTransformSpaces(socket, keysMan, callback) {
  return topic
    .listTopicSpaces(keysMan)
    .then((detailedTopics) => {
      // Extract unique spaces from topic list
      const spacesMap = new Map();

      detailedTopics.forEach(({ Spaces }) => {
        if (Spaces) {
          Spaces.split(', ').forEach((space) => {
            if (space && !spacesMap.has(space)) {
              spacesMap.set(space, { id: space, name: space });
            }
          });
        }
      });

      const spaces = Array.from(spacesMap.values());

      // why emit when you return the spaces next?
      socket.emit('spaces_update', { spaces });

      if (callback) callback({ success: true, spaces });
      return spaces;
    })
    .catch((err) => {
      console.error('Error fetching spaces from topics:', err);
      if (callback) callback({ success: false, error: err.message });
    });
}


// function fetchAndTransformSpaces(socket, keysMan, callback) {
//   //DEFERRED to open Space card workflow
//   // const { pkSpacesKey, spaceKey, topicContentKey, spaceOrderKey } = keysMan;
//   const { pkSpacesKey, spaceOrderKey } = keysMan;
//   Audit.add({ fnc: 'fetchAndTransformSpaces', pkSpacesKey, spaceOrderKey });
//   Audit.report('About to call getOrderedSpaces()');
//   return spaceMan
//     .getOrderedSpaces({ pkSpacesKey, spaceOrderKey })
//     .then((orderedSpaces) => {
//       // convert list of ids into list of objects
//       const spaces = orderedSpaces.map((id) => ({ id, name: id,topiqx: [] }));
//       // Emit spaces_update event for real-time updates
//       Audit.add({ fnc: 'fetchAndTransformSpaces', ...spaces });
//       Audit.report('Emitting spaces_update');

//       socket.emit('spaces_update', { spaces });

//       // Use callback for the fetch_spaces handler
//       if (callback) {
//         callback({ success: true, spaces });
//       }
//       return spaces;
//     })
//     .catch((err) => {
//       console.error('Error fetching spaces:', err);
//       callback({
//         success: false,
//         error: `Failed to fetch spaces: ${err.message}`,
//       });
//     });
// }
/*
keysMan:
pk
pkSpacesKey
pkTopicsKey
spaceKey
spaceOrderKey
topicContentKey
topicSpaceKey
topicStreamKey
*/
function registerSpaceHandlers({ socket, keysMan }) {
  const { spaceOrderKey } = keysMan;

  socket.on('fetch_spaces', (_, callback) => {
    fetchAndTransformSpaces(socket, keysMan, callback);
  });

  socket.on('create_space', async (toSpace, callback) => {
    const { spaceKey } = keysMan;

    // TODO throw an error here, but handle the error after so we don't tank server
    if (!toSpace) {
      console.error('\nA toSpace is required.\n');
      return;
    }

    const space = await spaceMan.createSpace(spaceKey, toSpace);

    callback({ success: true, space });
  });

  socket.on('fetch_space_topics', async ({ space }, callback) => {
    const { spaceKey, topicContentKey } = keysMan;
    const spaceId = space.id;
    const topicOrderKey = getTopicOrderKey(spaceId);
    try {
      // TODO throw an error here, but handle the error after so we don't tank server
      if (!space) {
        console.error('\nSpace is required.\n');
        return;
      }

      console.log(`Fetching topics for space: ${spaceId}`);
      const topics = await spaceMan.getSpaceTopics({
        spaceId,
        spaceKey,
        topicOrderKey,
        topicContentKey,
      });
      clj(topics, `Audit Fetched topics for space ${spaceId}:`); // Log fetched topics

      callback({ success: true, topics });
    } catch (err) {
      console.error(`Failed to fetch topics for space ${spaceId}:`, err);
      callback({ success: false, error: err.message });
    }
  });

  socket.on('move_topic', ({ id, fromSpace, toSpace, isClone }, callback) => {
    const action = isClone ? 'clone' : 'move';
    console.log(`move_topic received:`, action, { id, fromSpace, toSpace });

    if (!id) {
      callback({ success: false, error: 'Topic ID is required.' });
      return;
    }

    spaceMan
      .handleSpaceTransformation({
        id,
        fromSpace,
        toSpace,
        keysMan,
        isClone,
      })
      .then(() => fetchAndTransformSpaces(socket, keysMan, callback))
      .then((spaces) => {
        const orderedIDs = spaces.map((space) => space.id); // Extract the order
        return handleReorderSpaces({ orderedIDs, spaceOrderKey }); // Update persistence
      })
      .catch((err) => {
        console.error('Error moving topic:', err);
        callback({ success: false, error: 'Failed to move topic.' });
      });
  });

  socket.on('reorder_spaces', ({ orderedIDs }, callback) => {
    console.log('Backend received reorder_spaces event with:', orderedIDs);

    // Save the new order
    handleReorderSpaces({ orderedIDs, spaceOrderKey })
      .then(() => {
        console.log('Space order saved successfully');
        if (callback) callback({ success: true });
      })
      .catch((err) => {
        console.error('Error saving space order:', err);
        if (callback) callback({ success: false, error: err.message });
      });
  });
  socket.on('testing', (msg) => {
    console.log(`**********  ${msg}  **********`);
  });

  socket.on('delete_topic_from_space', ({ id, fromSpace }, callback) => {
    console.time('spaceController in');
    Audit.add({
      intent: 'Remove Topic',
      vue: 'spaceController',
      msg: 'Step Two',
      function: "socket.on('delete_topic_from_space()'",
      id,
      fromSpace,
      toSpace: null,
      action: null,
    });
    if (!id || !fromSpace) {
      console.error('audit: Missing required parameters: id or fromSpace');

      callback({
        success: false,
        error: 'Missing required parameters: id or fromSpace',
      });
      return;
    }

    topic
      .deleteTopicFromSpace({ id, fromSpace, keysMan })
      .then((ct) => {
        if (ct) {
          console.log(ct);
          Audit.add({
            intent: 'Successfully deleted topic ${id} from space ${fromSpace}',
            fnc: 'deleteTopicFromSpace()',
          });
          Audit.report('spaceController.deleteTopicFromSpace()');
        }

        fetchAndTransformSpaces(socket, keysMan, callback);
      })
      .catch((err) => {
        console.warn('audit: Error deleting topic from space:', err);
        callback({
          success: false,
          error: `Failed to delete topic from space: ${err.message}`,
        });
      });
    console.timeEnd('spaceController in');
  });

  // socket.on(
  //   'move',
  //   ({ id, fromSpace, toSpace, isClone, type, position }, callback) => {
  //     const action = isClone ? 'clone' : 'move';
  //     Audit.add({
  //       action,
  //       type,
  //       id,
  //       fromSpace,
  //       toSpace,
  //       position,
  //     });
  //     Audit.report('Audit: spaceController.socket.on("move")');
  //     if (!id || !type) {
  //       callback({ success: false, error: 'ID and type are required.' });
  //       return;
  //     }

  //     spaceMan
  //       .handleSpaceTransformation({
  //         id,
  //         fromSpace,
  //         toSpace,
  //         keysMan,
  //         isClone,
  //         type,
  //         position,
  //       })
  //       .then(() => fetchAndTransformSpaces(socket, keysMan, callback))
  //       .then((spaces) => {
  //         if (type === 'space') {
  //           const orderedIDs = spaces.map((space) => space.id); // Extract the order
  //           return handleReorderSpaces({ orderedIDs, spaceOrderKey }); // Persist reordering
  //         }
  //       })
  //       .catch((err) => {
  //         console.error('Error moving object:', err);
  //         callback({ success: false, error: 'Failed to move object.' });
  //       });
  //   }
  // );
  socket.on(
    'move',
    ({ id, fromSpace, toSpace, isClone, type, position }, callback) => {
      const action = isClone ? 'clone' : 'move';

      Audit.add({
        action,
        type,
        id,
        fromSpace,
        toSpace,
        position,
        step: 'Before handleSpaceTransformation()',
      });
      Audit.report('Audit: spaceController.socket.on("move") - BEFORE');

      // if (!id || !type) {
      //   callback({ success: false, error: 'ID and type are required.' });
      //   return;
      // }

      spaceMan
        .handleSpaceTransformation({
          id,
          fromSpace,
          toSpace,
          keysMan,
          isClone,
          type,
          position,
        })
        .then(() => {
          Audit.add({
            id,
            fromSpace,
            toSpace,
            type,
            step: 'After handleSpaceTransformation()',
          });
          Audit.report('Audit: spaceController.socket.on("move") - AFTER');

          return fetchAndTransformSpaces(socket, keysMan, callback);
        })
        .then((spaces) => {
          if (type === 'space') {
            const orderedIDs = spaces.map((space) => space.id);

            Audit.add({
              orderedIDs,
              step: 'Before handleReorderSpaces()',
            });
            Audit.report('Audit: handleReorderSpaces() - BEFORE');

            return handleReorderSpaces({ orderedIDs, spaceOrderKey }).then(
              () => {
                Audit.report('Audit: handleReorderSpaces() - AFTER');
              }
            );
          }
        })
        .catch((err) => {
          console.error('Error moving object:', err);
          callback({ success: false, error: 'Failed to move object.' });
        });
    }
  );
}

export  {
 registerSpaceHandlers };

const topic = require('./redis/commands/topic');
const spaceMan = require('./redis/spaceMan');

function fetchAndTransformTopics(io, keysMan, callback) {
  topic
    .listTopicSpaces(keysMan) // Ensure we get topics with spaces
    .then((topics) => {
      topics = topics.map((topic) => ({
        ...topic,
        // Spaces: topic.Spaces ? topic.Spaces.split(', ') : [], // Ensure Spaces is an array
      }));

      io.emit('topics_update', topics); // Send updated topics list to the UI
      if (callback) {
        callback({ success: true, topics });
      }
    })
    .catch((err) => {
      console.error('Error fetching topics:', err);
      if (callback) {
        callback({
          success: false,
          error: `Failed to fetch topics: ${err.message}`,
        });
      }
    });
}

function registerTopicHandlers(socket, io, keysMan) {
  socket.on('fetch_topics', (_, callback) => {
    fetchAndTransformTopics(io, keysMan, callback);
  });
  socket.on('testing', (msg) => {
    console.log(`**********  ${msg}  **********`);
  });

  // Handle saving topic order sent by Syntopix
  socket.on('save_topic_order', async ({ spaceId, newOrder }, callback) => {
    try {
      if (!spaceId || !Array.isArray(newOrder)) {
        throw new Error('Invalid data: spaceId or newOrder is missing/invalid');
      }

      console.log(`Saving topic order for space ${spaceId}:`, newOrder);

      // Use spaceMan to persist the order in Redis
      await spaceMan.saveTopicOrder(spaceId, newOrder);

      // Send success response
      callback({ success: true });
    } catch (error) {
      console.error(`Failed to save topic order for space ${spaceId}:`, error);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('delete_topic', ({ id }, callback) => {
    if (!id && callback) {
      callback({ success: false, error: 'Missing id parameter' });
      return;
    }

    topic
      .deleteTopic({ id, keysMan }) // Reuse CLI logic for deletion
      .then(() => {
        fetchAndTransformTopics(io, keysMan, callback);
      })
      .catch((err) => {
        console.error('Error deleting topic:', err);
        if (callback) {
          callback({
            success: false,
            error: `Failed to delete topic: ${err.message}`,
          });
        }
      });
  });

  socket.on('edit_topic', (editThisTopic, callback) => {
    if (!editThisTopic.id && callback) {
      callback({ success: false, error: 'Missing id parameter' });
      return;
    }

    topic
      .getTopic({ topic: editThisTopic, keysMan }) // Reuse CLI logic for deletion
      .then((topic) => {
        console.log('topic :>> ', topic);
        console.log();
        if (callback) {
          callback(topic);
        }
      })
      .catch((err) => {
        console.error('Error deleting topic:', err);
        if (callback) {
          callback({
            success: false,
            error: `Failed to delete topic: ${err.message}`,
          });
        }
      });
  });

  socket.on('add_topic', (newTopic, callback) => {
    topic
      .addTopic(keysMan, newTopic)
      .then((response) => {
        if (response.success) {
          io.emit('topics_update', newTopic); // Emit an update event if needed
        }
        if (callback) {
          callback(response);
        }
      })
      .catch((err) => {
        console.error('Error adding topic:', err);
        if (callback) {
          callback({ success: false, error: err.message });
        }
      });
  });

  socket.on('save_topic_content', async (topicToSave, callback) => {
    try {
      const key = `${keysMan.topicContentKey}:${topicToSave.id}`;
      console.log('save_topic_content is using key :>> ', key);
      console.log();
      await topic.updateTopicContent({
        key,
        updates: topicToSave,
      });
      callback({ success: true });
    } catch (err) {
      callback({ success: false, error: err.message });
    }
  });

  socket.on(
    'move_topic_to_space',
    async ({ topicId, targetSpaceId, oldSpaceId }, callback) => {
      try {
        if (!topicId || !targetSpaceId) {
          throw new Error(
            'Missing required parameters: topicId and targetSpaceId'
          );
        }

        const { topicSpaceKey } = keysMan;

        // Fetch existing spaces for the topic
        let spaces = await topic.getTopicSpaces({ topicId, topicSpaceKey });
        if (!Array.isArray(spaces)) {
          spaces = [];
        }

        // Remove topic from the old space (if applicable)
        if (oldSpaceId) {
          spaces = spaces.filter((space) => space !== oldSpaceId);
        }

        // Add topic to the new space if not already present
        if (!spaces.includes(targetSpaceId)) {
          spaces.push(targetSpaceId);
        }

        // Update Redis
        await topic.updateTopicSpaces(topicId, spaces);
        console.log(
          `✅ Moved topic ${topicId} from ${oldSpaceId} to ${targetSpaceId}`
        );

        // Emit updated topics list
        fetchAndTransformTopics(io, keysMan);

        callback({ success: true });
      } catch (err) {
        console.error(
          `❌ Error moving topic ${topicId} to space ${targetSpaceId}:`,
          err
        );
        callback({ success: false, error: err.message });
      }
    }
  );

  socket.on('add_space_to_topic', async ({ topicId, newSpaceId }, callback) => {
    try {
      if (!topicId || !newSpaceId) {
        throw new Error('Missing required parameters: topicId and newSpaceId');
      }

      const { topicSpaceKey } = keysMan;

      // Fetch existing spaces for the topic
      let spaces = await topic.getTopicSpaces({ topicId, topicSpaceKey });
      if (!Array.isArray(spaces)) {
        spaces = [];
      }

      // Add new space if it's not already assigned
      if (!spaces.includes(newSpaceId)) {
        spaces.push(newSpaceId);
        await topic.updateTopicSpaces(topicId, spaces);
        console.log(`✅ Added space ${newSpaceId} to topic ${topicId}`);
      }

      // Emit updated topics list to all clients
      fetchAndTransformTopics(io, keysMan);

      callback({ success: true });
    } catch (err) {
      console.error(
        `❌ Error adding space ${newSpaceId} to topic ${topicId}:`,
        err
      );
      callback({ success: false, error: err.message });
    }
  });

  socket.on('remove_space_from_topic', ({ topicId, fromSpace }) =>
    topic
      .deleteSpaceFromTopic({ id: topicId, fromSpace, keysMan })
      .then(() => fetchAndTransformTopics(io, keysMan))
  );
  socket.on('persist_topic_order', ({ newTopicOrder, pkTopicsKey }) =>
    topic
      .persistTopicOrder({ newTopicOrder, pkTopicsKey }, keysMan)
      .then(() => fetchAndTransformTopics(io, keysMan))
  );

  socket.on('delete_space_from_topics', (space) => {
    console.log('keysMan :>> ', keysMan);
    topic
      .deleteSpace(space, keysMan)
      .then(() => fetchAndTransformTopics(io, keysMan));
  });

  socket.on(
    'remove_space_from_topicX',
    async ({ topicId, fromSpace }, callback) => {
      try {
        if (!topicId || !fromSpace) {
          throw new Error('Missing required parameters: topicId and fromSpace');
        }

        const { topicSpaceKey } = keysMan;

        // Fetch existing spaces for the topic
        let spaces = await topic.getTopicSpaces({ topicId, topicSpaceKey });
        if (!Array.isArray(spaces)) {
          spaces = [];
        }

        // Add new space if it's not already assigned
        if (!spaces.includes(fromSpace)) {
          spaces.push(fromSpace);
          await topic.updateTopicSpaces(topicId, spaces);
          console.log(`✅ Added space ${fromSpace} to topic ${topicId}`);
        }

        // Emit updated topics list to all clients
        fetchAndTransformTopics(io, keysMan);

        callback({ success: true });
      } catch (err) {
        console.error(
          `❌ Error adding space ${fromSpace} to topic ${topicId}:`,
          err
        );
        callback({ success: false, error: err.message });
      }
    }
  );
}

module.exports = { registerTopicHandlers };

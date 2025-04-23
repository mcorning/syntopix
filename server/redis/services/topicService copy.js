const RedisService = require('./redisService');
const { ask } = require('../commands/readline');
const { queryArray } = require('../../utils/helpers');

// Create the minimal topic document in the topics stream
function createDocument(topicStreamKey) {
  return RedisService.addToStream(
    topicStreamKey,
    '*',
    'creator',
    Date.now()
  ).then((streamId) => ({
    streamId,
    pk: streamId,
  }));
}

// Add the full topic content to a Redis hash
function addTopicContent({
  streamId,
  title,
  summary,
  content,
  isPrivateFlag,
  topicContentKey,
  pk,
}) {
  if (!streamId || !title) {
    throw new Error('Invalid arguments: streamId and title are required');
  }

  const topicKey = `${topicContentKey}:${streamId}`;
  const value = {
    title,
    summary: summary || 'No summary provided',
    content,
    isPrivate: isPrivateFlag,
    createdBy: pk,
  };

  return RedisService.setHash(topicKey, value).then(() => {
    console.log(`Topic content added under key: ${topicKey}`);
    return { streamId, title };
  });
}

/**
 * Updates one or more fields in the topic content hash.
 * @param {string} key - Topic ID
 * @param {Object} updates - Field-value map to update
 */
async function updateTopicContent({ key, updates }) {
  return RedisService.updateHashFields(key, updates);
}

// called by topic:getTopic()
function getTopicContent(key) {
  if (!key) {
    throw new Error(
      'Invalid arguments: streamId and topicContentKey are required'
    );
  }


  return RedisService.getHashContent(key).then((content) => {
    console.log(`Topic content under key: ${key}`);
    return content;
  });
}

// Update the PK-to-Topic mapping
function updatePkTopics(pkTopicsKey, id, title) {
  return RedisService.setHashField(pkTopicsKey, id, title).then((result) => {
    if (result === 0) {
      console.warn(`No updates made to ${pkTopicsKey} for id ${id}`);
    }
    return result;
  });
}

// Pick a topic by index or title
function pickTopic(defaultTopicTitle, topics) {
  return ask('Enter Topic [by index or Title]:', defaultTopicTitle, 1).then(
    (topicTitle) => {
      console.log('\tConfirming Topic:>> ', topicTitle);

      const topic = queryArray(
        topicTitle,
        (t) => t.title === topicTitle,
        topics
      );

      // If no topic is found, create a new one
      if (!topic) {
        console.warn(`Topic "${topicTitle}" not found. Creating a new topic.`);
        return {
          id: `new-${Date.now()}`,
          title: topicTitle,
          spaces: [],
        };
      }

      const { id, title, spaces } = topic;
      return { id, title, spaces };
    }
  );
}

// Fetch topics for a given PK
function fetchTopicsForPk(pkTopicsKey, topicContentKey) {
  if (!pkTopicsKey || !topicContentKey) {
    throw new Error(
      'Invalid arguments: pkTopicsKey and topicContentKey are required.'
    );
  }

  return RedisService.getHashContent(pkTopicsKey)
    .then((topics) => {
      if (!topics || Object.keys(topics).length === 0) {
        console.log(`No topics found for PK key: ${pkTopicsKey}`);
        return []; // Return an empty array if no topics are found
      }

      const topicKeys = Object.keys(topics);

      return Promise.all(
        topicKeys.map((id) => {
          const topicKey = `${topicContentKey}:${id}`;
          return RedisService.getHashContent(topicKey)
            .then((content) => {
              if (!content || Object.keys(content).length === 0) {
                console.warn(`No content found for topic ID: ${id}`);
                return { id, title: 'Untitled' }; // Default to 'Untitled' if content is missing
              }
              console.log('content :>> ', { ...content });
              return {
                id,
                title: content.title || 'Untitled', // Default title if none provided
                summary: content.summary,
                content: content.content,
              };
            })
            .catch((err) => {
              console.error(
                `Error fetching content for topicKey: ${topicKey}`,
                err
              );
              return { id, title: 'Error fetching content' }; // Handle errors gracefully
            });
        })
      );
    })
    .catch((err) => {
      console.error(`Error fetching topics for PK key: ${pkTopicsKey}`, err);
      throw err; // Re-throw the error to ensure it can be handled by the caller
    });
}

// Fetch spaces for a given topic
function fetchSpacesForTopic(id, topicSpaceKey) {
  const thisTopicSpacesKey = `${topicSpaceKey}:${id}:spaces`;

  return RedisService.getSetMembers(thisTopicSpacesKey)
    .then((topicSpaces) => topicSpaces)
    .catch((err) => {
      console.error(`Error fetching spaces for topic ID: ${id}`, err);
      throw err;
    });
}

// Scan topics in the database
function scanTopics(keysMan) {
  const { topicStreamKey, topicContentKey } = keysMan;

  if (!topicStreamKey || !topicContentKey) {
    throw new Error('Missing required keys for scanTopics');
  }

  const results = [];
  let cursor = '0';

  const scan = () => {
    return RedisService.scanKeys(`${topicContentKey}:*`, cursor).then((res) => {
      cursor = res[0];
      const keys = res[1];
      results.push(...keys);

      if (cursor !== '0') {
        return scan();
      } else {
        return results;
      }
    });
  };

  return scan().then((keys) => {
    const promises = keys.map((key) => {
      return RedisService.getHashContent(key).then((content) => ({
        key,
        content,
      }));
    });

    return Promise.all(promises).then((topics) => topics);
  });
}

function addTopicCore({
  streamId,
  title,
  summary,
  isPrivateFlag,
  topicContentKey,
  pkTopicsKey,
  pk,
}) {
  return addTopicContent({
    streamId,
    title,
    summary,
    isPrivateFlag,
    topicContentKey,
    pk,
  })
    .then(() => updatePkTopics(pkTopicsKey, streamId, title))
    .then(() => ({
      streamId,
      title,
    }))
    .catch((err) => {
      console.error('Error in addTopicCore:', err);
      throw err;
    });
}

/*
1) remove a Topic from the Topics page
     a) removes the topic from the database
     b) removes the topicId from the spaces key for the pk
          19:tensor:spaces:1735954146712-0:First:topics
     c) removes the Space name from the topics key
          19:tensor:topics:1736561477990-0:spaces
2) removing a Topic from a Space should be limited to the Space.

First, use the PK hash
19:tensor:pks:1735954146712-0:topics
to remove the Topic ID

Next, from a PK's SET
19:tensor:spaces:1735954146712-0:First:topics
remove the Topic member 1736561477990-0

Finally, delete
SET 19:tensor:topics:1736626750755-0:spaces
and
HASH 19:tensor:topics:content:1736626750755-0
*/
async function deleteTopic({ id, keysMan }) {
  const { pkTopicsKey, topicSpaceKey, topicContentKey } = keysMan;

  // Step 1: Remove Topic ID from PK hash
  await RedisService.removeFromHash(pkTopicsKey, id);

  // Step 2: Fetch associated Spaces and remove Topic from them
  const topicSpacesKey = `${topicSpaceKey}:${id}:spaces`;
  const spaces = await RedisService.getSetMembers(topicSpacesKey);

  for (const spaceName of spaces) {
    // Remove Topic from Space's SET
    const spaceTopicsKey = `${keysMan.spaceKey}:${spaceName}:topics`;
    await RedisService.removeFromSet(spaceTopicsKey, id);

    // Remove Space name from Topic's spaces SET
    await RedisService.removeFromSet(topicSpacesKey, spaceName);
  }

  // Step 3: Delete Topic's spaces key
  await RedisService.removeFromSet(topicSpacesKey);

  // Step 4: Delete Topic's content hash
  const topicContentHash = `${topicContentKey}:${id}`;
  await RedisService.removeFromHash(topicContentHash);
}
async function deleteTopicFromSpace({ id, fromSpace, keysMan }) {
  // e.g., id=1736798780655-0
  //       19:tensor:topics:1736798780655-0:spaces
  //       19:tensor:spaces:1735954146712-0:a:topics
  const { topicSpaceKey } = keysMan;

  const spaceTopicsKey = `${keysMan.spaceKey}:${fromSpace}:topics`;
  const topicSpacesKey = `${topicSpaceKey}:${id}:spaces`;

  console.warn(
    `audit: Attempting to remove ${id} from spaceTopicsKey: ${spaceTopicsKey}`
  );

  const removedFromSpace = await RedisService.removeFromSet(spaceTopicsKey, id);

  if (!removedFromSpace) {
    console.warn(
      `audit: Topic ${id} was not in spaceTopicsKey: ${spaceTopicsKey}`
    );
  }

  console.warn(
    `audit: Attempting to remove ${fromSpace} from topicSpacesKey: ${topicSpacesKey}`
  );
  // Remove Space name from Topic's spaces SET
  const removedFromTopic = await RedisService.removeFromSet(
    topicSpacesKey,
    fromSpace
  );

  if (!removedFromTopic) {
    console.warn(
      `audit: Space ${fromSpace} was not in topicSpacesKey: ${topicSpacesKey}`
    );
  }

  console.warn(
    `audit: Completed deletion of topic ${id} from space ${fromSpace}`
  );
}

/**
 * Deletes a Space and all associated topics.
 * @param {Object} space - The ID of the space to delete.
 * @returns {Promise<Object>} - Success or failure response.
 */
function deleteSpace({ space }, keysMan) {
  const { topicSpaceKey } = keysMan;

  console.log(`Deleting Space: ${space.name}`);
  console.log(`and its Topics: ${[...space.topics]}`);

  const promises = space.topics.map((topic) =>
    RedisService.removeFromList(`${topicSpaceKey}:${topic.id}`, space.name)
  );
  return Promise.all(promises);
}
function persistTopicOrder({ newTopicOrder }, keysMan) {
  const { pkTopicsKey } = keysMan;

  return RedisService.persistTopicOrder({ newTopicOrder, pkTopicsKey });
}

async function deleteSpaceFromTopic({ id, fromSpace, keysMan }) {
  // 19:syntopix:topics:spaces:1740785500670-0
  const { topicSpaceKey } = keysMan;

  const topicSpacesKey = `${topicSpaceKey}:${id}`;

  console.warn(
    `audit: Attempting to remove ${fromSpace} from topicSpaceKey: ${topicSpacesKey}`
  );

  const removedFromSpace = await RedisService.removeFromList(
    topicSpacesKey,
    fromSpace
  );

  if (!removedFromSpace) {
    console.warn(
      `audit: Space ${id} was not in topicSpacesKey: ${topicSpacesKey}`
    );
  }
}

/**
 * Updates the spaces for a topic, storing them as a Redis LIST.
 * @param {string} topicId - The topic ID.
 * @param {Array<string>} spaces - The ordered list of spaces.
 * @returns {Promise<Object>} - Success or error response.
 */
async function updateTopicSpaces(topicId, spaces) {
  const redisKey = `19:syntopix:topics:spaces:${topicId}`;

  try {
    await RedisService.deleteKey(redisKey); // Clear existing spaces
    if (spaces.length > 0) {
      await RedisService.saveSpaceOrder(redisKey, spaces); // Store ordered list
    }
    console.log(`✅ Updated topic ${topicId} spaces:`, spaces);
    return { success: true };
  } catch (err) {
    console.error(`❌ Error updating topic ${topicId} spaces:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves the ordered list of spaces assigned to a topic.
 * @param {string} topicId - The topic ID.
 * @returns {Promise<Array<string>>} - Ordered list of spaces.
 */
async function getTopicSpaces({ topicId, topicSpaceKey }) {
  const key = `${topicSpaceKey}:${topicId}`;

  try {
    return await RedisService.getOrderedList(key); // Fetch ordered spaces
  } catch (err) {
    console.error(`❌ Error fetching topic ${key} spaces:`, err);
    return [];
  }
}

module.exports = {
  createDocument,
  addTopicContent,
  getTopicContent,
  updatePkTopics,
  pickTopic,
  fetchTopicsForPk,
  fetchSpacesForTopic,
  scanTopics,
  addTopicCore,
  deleteTopic,
  deleteTopicFromSpace,
  updateTopicSpaces,
  getTopicSpaces,

  deleteSpaceFromTopic,
  deleteSpace,
  persistTopicOrder,

  updateTopicContent,
};

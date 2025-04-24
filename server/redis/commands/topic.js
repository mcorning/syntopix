import topicService from '../services/topicService.js';

/**
 * Adds a new topic.
 *
 * @param {Object} keysMan - The keys manager object.
 * @param {Object} topic - Data containing title and summary.
 * @returns {Promise<Object>} - Resolves with the streamId and title on success.
 */
function addTopic(keysMan, topic) {
  const { title, summary } = topic;

  return topicService
    .createDocument(keysMan.topicStreamKey)
    .then(({ streamId }) => {
      const isPrivateFlag = '0';
      return topicService.addTopicCore({
        streamId,
        title,
        summary,
        isPrivateFlag,
        topicContentKey: keysMan.topicContentKey,
        pkTopicsKey: keysMan.pkTopicsKey,
        pk: keysMan.pk,
      });
    })
    .then(({ streamId, title }) => ({
      success: true,
      message: `Topic "${title}" added successfully. ${streamId}`,
    }))
    .catch((err) => ({
      success: false,
      error: err.message,
    }));
}

// called by topicController: edit_topic handler
function getTopic({ keysMan, topic }) {
  console.log('topic :>> ', JSON.stringify(topic, null, 2));
  const { topicContentKey } = keysMan;
  const key = `${topicContentKey}:${topic.id}`;
  return topicService.getTopicContent(key).then((content) => {
    console.log('content :>> ', content);
    return content;
  });
}

/**
 * Proxy to update topic content fields via topicService.
 * @param {Object} opts
 * @param {string} opts.key - Topic ID
 * @param {Object} opts.updates - Field-value map
 */
function updateTopicContent({ key, updates }) {
  return topicService.updateTopicContent({ key, updates });
}

function getTopicsForPk(keysMan) {
  const { pkTopicsKey, topicContentKey } = keysMan;
  return topicService.fetchTopicsForPk(pkTopicsKey, topicContentKey);
}

function listTopicSpaces(keysMan) {
  return getTopicsForPk(keysMan)
    .then((topics) => {
      if (!topics || topics.length === 0) {
        console.log(`No topics found for PK: ${keysMan.pk}`);
        return [];
      }
      const topicSpaceKey = keysMan.topicSpaceKey;
      return Promise.all(
        topics.map(({ id, title, summary, content }) =>
          getTopicSpaces({ topicId: id, topicSpaceKey }).then((spaces) => ({
            id,
            title,
            summary,
            words: content ? content.trim().split(/\s+/).length : 0,
            spaces,
          }))
        )
      );
    })
    .then((detailedTopics) => {
      if (!detailedTopics || detailedTopics.length === 0) {
        console.log('\nNo topics with associated spaces found.');
        return [];
      }

      console.log('\nTopics and their Spaces:');
      console.table(detailedTopics);
      return detailedTopics;
    })
    .catch((err) => {
      console.error('Error listing topic spaces:', err);
    });
}

function deleteTopic({ id, keysMan }) {
  return topicService.deleteTopic({ id, keysMan });
}

function deleteTopicFromSpace({ id, fromSpace, keysMan }) {
  return topicService.deleteTopicFromSpace({ id, fromSpace, keysMan });
}

function deleteSpaceFromTopic({ id, fromSpace, keysMan }) {
  return topicService.deleteSpaceFromTopic({ id, fromSpace, keysMan });
}
function deleteSpace({ space }, keysMan) {
  return topicService.deleteSpace({ space }, keysMan);
}
function persistTopicOrder({ newTopicOrder }, keysMan) {
  return topicService.persistTopicOrder({ newTopicOrder }, keysMan);
}

/**
 * Updates the spaces for a topic.
 *
 * @param {string} topicId - The topic ID.
 * @param {Array<string>} spaces - The ordered list of spaces to assign.
 * @returns {Promise<Object>} - Success or error response.
 */
async function updateTopicSpaces(topicId, spaces) {
  try {
    if (!topicId || !Array.isArray(spaces)) {
      throw new Error('Missing required parameters: topicId and spaces array');
    }

    const result = await topicService.updateTopicSpaces(topicId, spaces);
    return result;
  } catch (err) {
    console.error(`❌ Error in topic.updateTopicSpaces(${topicId}):`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves the ordered list of spaces assigned to a topic.
 *
 * @param {string} topicId - The topic ID.
 * @returns {Promise<Array<string>>} - List of spaces for the topic.
 */
async function getTopicSpaces({ topicId, topicSpaceKey }) {
  try {
    // Fetch existing spaces for the topic
    const spaces = await topicService.getTopicSpaces({
      topicId,
      topicSpaceKey,
    });
    return spaces;
  } catch (err) {
    console.error(err);
    return [];
  }
}

export default {
  addTopic,
  getTopic,
  getTopicsForPk,
  listTopicSpaces,
  deleteTopic,
  deleteTopicFromSpace,
  updateTopicSpaces,
  getTopicSpaces,
  deleteSpaceFromTopic,
  deleteSpace,

  persistTopicOrder,
  updateTopicContent,
};

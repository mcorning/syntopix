const { pickTopic } = require('../services/topicService'); // Delegate topic logic
const { handleSpaceTransformation, fromSpace } = require('../spaceMan'); // Space-related transformations
const { ask } = require('./readline');
const { isEmpty, queryArray } = require('../../utils/helpers');

function moveTopic(keysMan, topics, spaces) {
  console.table(topics);

  const defaultTopicTitle =
    topics.length === 1 ? topics[0].title : topics.at(-1).title;
  const defaultDestination = spaces?.length > 1 ? spaces.at(-1) : '';

  const moveTopicToSpace = ({ topic, fromSpace, toSpace, message, isClone }) => {
    console.log(message);
    return handleSpaceTransformation({
      id: topic.id,
      fromSpace,
      toSpace,
      keysMan,
      isClone
    });
  };

  const isClone = ({ topic, fromSpace, toSpace }) => {
    if (isEmpty(spaces)) {
      const message = `\nAdding Topic "${topic.title}" to Space "${toSpace}"`;
      return Promise.resolve({ topic, fromSpace, toSpace, message });
    }
    return ask('Keep Topic in old and new Spaces (clone?) [y/n]?', 'n', 1).then(
      (isClone) => {
        const message =
          isClone === 'y'
            ? `\nCloning Topic "${topic.title}" to Space "${toSpace}"`
            : `\nMoving Topic "${topic.title}" from Space "${fromSpace}" to Space "${toSpace}"`;
        return { topic, fromSpace, toSpace, message, isClone:isClone==='y' };
      }
    );
  };

  const toSpace = ({ topic, fromSpace }) => {
    console.log("\nAuthor's Spaces");
    console.table(spaces);

    return ask('Enter a TO Space:', defaultDestination, 1).then((space) => {
      const func = (v) => v.trim() === space.trim();
      const toSpace = queryArray(space, func, spaces);
      console.log('\tConfirming TO Space:>> ', toSpace);
      return { topic, fromSpace, toSpace };
    });
  };

  return pickTopic(defaultTopicTitle, topics)
    .then((topic) => fromSpace(topic, spaces, topic.spaces))
    .then(({ topic, fromSpace }) => toSpace({ topic, fromSpace }))
    .then(({ topic, fromSpace, toSpace }) =>
      isClone({ topic, fromSpace, toSpace })
    )
    .then(({ topic, fromSpace, toSpace, message, isClone }) =>
      moveTopicToSpace({ topic, fromSpace, toSpace, message, isClone })
    );
}

module.exports = { moveTopic };

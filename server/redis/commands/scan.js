const { tabbed } = require('./readline');
const { scanTopics } = require('../services/topicService'); // Use the high-level scanTopics function

function scanCommand(keysMan) {
  return scanTopics(keysMan)
    .then((topics) => {
      if (topics.length === 0) {
        console.log('No topics found in the stream.');
        return;
      }

      topics.forEach((topic, index) => {
        if (Object.keys(topic.content).length === 0) {
          console.log(`Topic ${topic.key} has no content.`);
        } else {
          tabbed(`\nTopic #${index + 1}:`);
          tabbed(`Key: ${topic.key}`);
          tabbed(`Title: ${topic.content.title || 'No title'}`);
          tabbed(`Summary: ${topic.content.summary || 'No summary'}`);
          tabbed(`Authors: ${topic.content.authors || 'No authors'}`);
          tabbed('----------------------------\n\n');
        }
      });

      console.log('SCAN complete');
      return topics;
    })
    .catch((err) => {
      console.error('Error scanning topics:', err);
    });
}

module.exports = {scanCommand};

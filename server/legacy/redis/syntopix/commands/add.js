const { ask } = require('./readline');
const {
  createDocument,
  addTopicCore,
} = require('../../syntopix/services/topicService');


function addTopic({ topicStreamKey, topicContentKey, pkTopicsKey, pk }) {
  console.log('\nCommand: Add');

  return createDocument(topicStreamKey)
    .then(({ streamId }) =>
      ask('Enter the Topic title [or blank to cancel Add]: ')
        .then((title) => {
          if (!title) {
            console.log(
              '\nAbandoning Topic creation. Returning to commands list.'
            );
            throw new Error('Command Abandoned');
          }
          return ask('Enter the Topic summary: ').then((summary) => ({
            streamId,
            title,
            summary,
          }));
        })
        .then(({ streamId, title, summary }) => {
          const isPrivateFlag = '0';
          return addTopicCore({
            streamId,
            title,
            summary,
            isPrivateFlag,
            topicContentKey,
            pkTopicsKey,
            pk,
          });
        })
    )
    .then(({ streamId, title }) => {
      console.log(
        `\nRESULT: Author ${pk} added Topiq ID ${streamId}: ${title}`
      );
    })
    .catch((err) => {
      if (err.message === 'Command Abandoned') {
        console.log('\nTopic addition abandoned by the user.');
      } else {
        console.error('Error adding topic:', err);
      }
    });
}
module.exports = addTopic;

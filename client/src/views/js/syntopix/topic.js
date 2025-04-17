function moveTopic(client) {
  // this.client.emit(
  //   'move_topic',
  //   { id, fromSpace, toSpace, isClone },
  //   respond
  // );
  client.emit('move_topic')
}

function saveTopicOrder(client) {
  console.log('implement saveTopicOrder(client)', client)
}

function fetchTopicDetails(client) {
  client.emit('fetch_topic_details')
  // this.client.emit('fetch_topic_details', { id }, (response) => {
  //       if (response.success) {
  //         console.log('Fetched topic details:', response.details);
  //         this.selectedTopic = response.details; // Update with fetched details
  //       } else {
  //         console.error('Failed to fetch topic details:', response.error);
  //       }
  //     });
}
function addTopic(client) {
  client.emit('add_topic')
  // console.log('topic :>> ', topic);
  // // Topic already is an object, so don't wrap it in another object
  // this.client.emit('add_topic', topic, (response) => {
  //   if (response.error) {
  //     console.error('Failed to fetch topics:', response.error);
  //   } else {
  //     console.log('Fetched topics:', response.topics);
  //     this.fetchTopics();
  //   }
  // });
}

function deleteTopic(client) {
  client.emit('delete_topic')
  // console.log('topic :>> ', topic);
  // // Topic already is an object, so don't wrap it in another object
  // this.client.emit('delete_topic', { id: topic.id }, (response) => {
  //   if (response.error) {
  //     console.error('Failed to delete Topic:', response.error);
  //   } else {
  //     console.log('Deleted Topic:', response);
  //     // this.fetchTopics();
  //     this.fetchSpaces();
  //   }
  // });
}

function fetchTopicsForSpace(client) {
  client.emit('fetch_space_topics')
  // const spaceId = space.id;
  // this.client.emit('fetch_space_topics', { space }, (response) => {
  //   if (response.success) {
  //     const space = this.spaces.find((s) => s.id === spaceId);
  //     if (space) {
  //       // Ensure reactive update
  //       this.$set(space, 'topiqx', response.topics || []);
  //       console.log(`Updated topics for space ${spaceId}:`, space.topiqx);
  //     } else {
  //       console.warn(`Space with ID ${spaceId} not found.`);
  //     }
  //   } else {
  //     console.error(
  //       `Failed to fetch topics for space ${spaceId}:`,
  //       response.error
  //     );
  //   }
  // });
}

function fetchTopics(client) {
  client.emit('fetch_topics')
  // this.client.emit('fetch_topics', {}, (response) => {
  //   const { error, topics } = response;
  //   if (error) {
  //     console.error('Failed to fetch topics:', error);
  //   } else {
  //     console.log('Fetched topics:', topics);
  //     this.localTabTopics = topics;
  //     console.log('this.localTabTopics :>> ', this.localTabTopics);
  //   }
  // });
}

module.exports = {
  moveTopic,
  saveTopicOrder,
  fetchTopicDetails,
  addTopic,
  deleteTopic,
  fetchTopicsForSpace,
  fetchTopics,
}

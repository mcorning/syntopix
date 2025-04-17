function fetchSpaces(client) {
  client.emit('fetch_spaces')
  // this.client.emit('fetch_spaces', null, (response) => {
  //   this.spaces = response.spaces || [];
  // });
}

function deleteSpace(client) {
  client.emit('delete_space')
  // this.client.emit('delete_space', { spaceId }, (response) => {
  //   if (response.success) {
  //     console.log('Space deleted successfully.');
  //     this.fetchSpaces(); // Refresh spaces
  //   } else {
  //     console.error('Failed to delete space:', response.error);
  //   }
  // });
}

function reorderSpaces(client) {
  // this.client.emit(
  //   'reorder_spaces',
  //   { orderedIDs: newOrder },
  //   (response) => {
  //     if (response.success) {
  //       console.log('Space order saved successfully');
  //     } else {
  //       console.error('Failed to save space order:', response.error);
  //     }
  //   }
  // );
  client.emit('reorder_spaces')
}

function onDeleteTopicFromSpace(client) {
  client.emit('delete_topic_from_space')
  // this.client.emit(
  //   'delete_topic_from_space',
  //   { id, fromSpace },
  //   (response) => {
  //     // check value returned by redis delete
  //     if (response && response.success) {
  //       console.warn(
  //         `audit:  Successfully deleted topic ${id} from space ${fromSpace}`
  //       );
  //       this.fetchSpaces(); // Refresh spaces
  //     } else {
  //       console.error(
  //         `Failed to delete topic from space: ${response?.error}`
  //       );
  //     }
  //   }
  // );
  // console.timeEnd('onDeleteTopicFromSpace in');
}

function onAddTopicToSpace(client) {
  // this.client.emit('move_topic', { id, toSpace });
  client.emit('move_topic')
}
function onRemoveTopicFromSpace(client) {
  // this.client.emit('delete_topic_from_space', { id, fromSpace });
  client.emit('delete_topic_from_space')
}

module.exports = {
  fetchSpaces,
  deleteSpace,
  reorderSpaces,
  onDeleteTopicFromSpace,
  onAddTopicToSpace,
  onRemoveTopicFromSpace,
}

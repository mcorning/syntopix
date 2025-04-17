function moveTopic() {
  //   this.$emit('move-topic', { id, fromSpace, toSpace, action }, respond);
  this.$emit('move-topic')
}

function onTopicsReordered() {
  //   this.$emit('reorder-topics', { spaceId: space.id, newOrder });
  this.$emit('reorder-topics')
}

function onTopicsChanged() {
  //   this.$emit('spaces-updated', this.spaces);
  this.$emit('spaces-updated')
}

function selectTopic() {
  // this.$emit('select-topic', topic);
  this.$emit('select-topic')
}
module.exports = {
  moveTopic,
  onTopicsReordered,
  onTopicsChanged,
  selectTopic,
}

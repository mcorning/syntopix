function deleteSpace() {
  // this.$emit('delete-space', space.id);
  this.$emit('delete-space')
}

function toggleSpaceOpen() {
  //   this.$emit('update:openSpace', newOpenSpace); // Notify parent
  // NOTE: do we really need to call prefix this event name?
  this.$emit('update:openSpace') // Notify parent
}

function onReorderSpaces() {
  //   this.$emit('reorder-spaces', newOrder);
  this.$emit('reorder-spaces')
}

function addToSpace() {
  this.$emit('add-topic-to-space')
}

module.exports = {
  addToSpace,
  onReorderSpaces,
  deleteSpace,
  toggleSpaceOpen,
}

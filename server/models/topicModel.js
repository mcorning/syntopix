function validateTopicData({ spaceId, title, content }) {
  if (!spaceId || !title || !content) {
    throw new Error('Space ID, title, and content are required.')
  }
  return { spaceId, title, content, createdAt: Date.now() }
}

export default {
  validateTopicData,
}

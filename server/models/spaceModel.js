function validateSpaceData({ title }) {
  if (!title) {
    throw new Error('Space title is required.')
  }
  return { title, createdAt: Date.now() }
}

export default {
  validateSpaceData,
}

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { registerSpaceHandlers } = require('./spaceController');
const { registerTopicHandlers } = require('./topicControllerX');
const {  pj } = require('./utils/helpers');
const { createPk } = require('./redis/services/pkService');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const PORT = process.env.PORT || 3334;

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`syntopix-server index.js is running on port ${PORT}`);
});

io.on('connection', (socket) => {
  const pk = socket.handshake.auth.userID;
  const socketID = socket.id;
  console.log(
    "io.on('connection') :>> ",
    { socketID: socket.id, auth: socket.handshake.auth }
  );
  if (!pk) {
    createPk().then((pk) => socket.emit('handshake', { pk, socketID }));
  } else {
    socket.emit('handshake', { pk, socketID });
  }
  socket.on('set_keysMan', (keysMan) => {
    console.warn('Received keysMan from Vue:', keysMan);

    // Register handlers
    registerSpaceHandlers({ socket, keysMan });
    registerTopicHandlers(socket, io, keysMan);
  });

  socket.emit('testing', 'Come here, Watson.');
  socket.on('disconnect', () => {
    console.log(`Disconnected client: ${socket.id}`);
  });
});

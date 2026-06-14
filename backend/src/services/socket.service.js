let io;

const setSocketServer = (socketServer) => {
  io = socketServer;
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) {
    return;
  }

  io.to(`user:${userId}`).emit(event, payload);
};

module.exports = {
  setSocketServer,
  emitToUser
};

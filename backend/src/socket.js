const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const prisma = require("./config/prisma");
const {
  setSocketServer
} = require("./services/socket.service");
const {
  createNotification
} = require("./services/notification.service");

const conversationInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  finder: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  lostItem: true,
  foundItem: true
};

const messageInclude = {
  sender: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  conversation: {
    include: conversationInclude
  }
};

const isParticipant = (conversation, userId) =>
  conversation.ownerId === userId ||
  conversation.finderId === userId;

const initializeSocket = (server) => {
  const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  },
});

  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(
          " "
        )[1];

      if (!token) {
        return next(new Error("Not authorized"));
      }

      socket.user = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on(
      "conversation:join",
      async (conversationId, callback) => {
        const conversation =
          await prisma.conversation.findUnique({
            where: {
              id: Number(conversationId)
            }
          });

        if (
          !conversation ||
          !isParticipant(
            conversation,
            socket.user.id
          )
        ) {
          callback?.({
            ok: false,
            message: "Conversation not found"
          });
          return;
        }

        socket.join(
          `conversation:${conversation.id}`
        );
        callback?.({ ok: true });
      }
    );

    socket.on(
      "message:send",
      async (payload, callback) => {
        try {
          const conversationId = Number(
            payload?.conversationId
          );
          const body = payload?.body?.trim();

          if (!conversationId || !body) {
            callback?.({
              ok: false,
              message:
                "Conversation and message are required"
            });
            return;
          }

          const conversation =
            await prisma.conversation.findUnique({
              where: {
                id: conversationId
              },
              include: conversationInclude
            });

          if (
            !conversation ||
            !isParticipant(
              conversation,
              socket.user.id
            )
          ) {
            callback?.({
              ok: false,
              message: "Conversation not found"
            });
            return;
          }

          const message =
            await prisma.message.create({
              data: {
                conversationId,
                senderId: socket.user.id,
                body
              },
              include: messageInclude
            });

          io.to(
            `conversation:${conversationId}`
          ).emit("message:new", message);

          const recipientId =
            conversation.ownerId === socket.user.id
              ? conversation.finderId
              : conversation.ownerId;

          io.to(`user:${recipientId}`).emit(
            "message:new",
            message
          );

          await createNotification({
            userId: recipientId,
            type: "NEW_MESSAGE",
            title: "New message",
            message: `${message.sender.name} sent you a message.`,
            link: `/messages/${conversationId}`
          });

          callback?.({
            ok: true,
            message
          });
        } catch (error) {
          callback?.({
            ok: false,
            message: error.message
          });
        }
      }
    );
  });

  setSocketServer(io);

  return io;
};

module.exports = initializeSocket;

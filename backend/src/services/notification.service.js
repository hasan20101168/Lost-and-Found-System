const prisma = require("../config/prisma");
const { emitToUser } = require("./socket.service");
const {
  sendEmailNotification
} = require("./email.service");

const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  email = true
}) => {
  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link
      }
    });

  emitToUser(userId, "notification:new", notification);

  if (email) {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        email: true
      }
    });

    sendEmailNotification({
      to: user?.email,
      subject: title,
      text: message
    }).catch((error) => {
      console.error("Email notification failed", error);
    });
  }

  return notification;
};

module.exports = {
  createNotification
};

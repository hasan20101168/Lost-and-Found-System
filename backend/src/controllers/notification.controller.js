const prisma = require("../config/prisma");

exports.getNotifications = async (req, res) => {
  try {
    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.user.id
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 50
      });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.markNotificationRead = async (
  req,
  res
) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        message:
          "Notification id must be a valid number"
      });
    }

    const notification =
      await prisma.notification.updateMany({
        where: {
          id,
          userId: req.user.id
        },
        data: {
          readAt: new Date()
        }
      });

    if (notification.count === 0) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.markAllNotificationsRead = async (
  req,
  res
) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

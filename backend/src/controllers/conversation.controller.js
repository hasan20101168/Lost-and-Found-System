const prisma = require("../config/prisma");
const {
  createNotification
} = require("../services/notification.service");

const userSelect = {
  id: true,
  name: true,
  email: true
};

const conversationInclude = {
  owner: {
    select: userSelect
  },
  finder: {
    select: userSelect
  },
  lostItem: true,
  foundItem: true,
  claimRequest: true,
  messages: {
    orderBy: {
      createdAt: "desc"
    },
    take: 1,
    include: {
      sender: {
        select: userSelect
      }
    }
  }
};

const messageInclude = {
  sender: {
    select: userSelect
  }
};

const isParticipant = (conversation, userId) =>
  conversation.ownerId === userId ||
  conversation.finderId === userId;

const parseOptionalId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? NaN : parsed;
};

exports.createConversation = async (req, res) => {
  try {
    const lostItemId = parseOptionalId(
      req.body.lostItemId
    );
    const foundItemId = parseOptionalId(
      req.body.foundItemId
    );
    const claimRequestId = parseOptionalId(
      req.body.claimRequestId
    );

    if (
      Number.isNaN(lostItemId) ||
      Number.isNaN(foundItemId) ||
      Number.isNaN(claimRequestId)
    ) {
      return res.status(400).json({
        message: "Item ids must be valid numbers"
      });
    }

    let ownerId;
    let finderId;

    if (claimRequestId) {
      const claim =
        await prisma.claimRequest.findUnique({
          where: {
            id: claimRequestId
          },
          include: {
            foundItem: true
          }
        });

      if (!claim) {
        return res.status(404).json({
          message: "Claim request not found"
        });
      }

      ownerId = claim.claimantId;
      finderId = claim.foundItem.userId;

      if (![ownerId, finderId].includes(req.user.id)) {
        return res.status(403).json({
          message: "Forbidden"
        });
      }

      const conversation =
        await prisma.conversation.upsert({
          where: {
            claimRequestId
          },
          create: {
            ownerId,
            finderId,
            foundItemId: claim.foundItemId,
            claimRequestId
          },
          update: {},
          include: conversationInclude
        });

      return res.status(201).json(conversation);
    }

    if (!lostItemId || !foundItemId) {
      return res.status(400).json({
        message:
          "Lost item and found item are required"
      });
    }

    const [lostItem, foundItem] =
      await Promise.all([
        prisma.lostItem.findUnique({
          where: {
            id: lostItemId
          }
        }),
        prisma.foundItem.findUnique({
          where: {
            id: foundItemId
          }
        })
      ]);

    if (!lostItem || !foundItem) {
      return res.status(404).json({
        message: "Items not found"
      });
    }

    ownerId = lostItem.userId;
    finderId = foundItem.userId;

    if (![ownerId, finderId].includes(req.user.id)) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    if (ownerId === finderId) {
      return res.status(400).json({
        message:
          "You cannot start a conversation with yourself"
      });
    }

    const conversation =
      await prisma.conversation.upsert({
        where: {
          ownerId_finderId_lostItemId_foundItemId: {
            ownerId,
            finderId,
            lostItemId,
            foundItemId
          }
        },
        create: {
          ownerId,
          finderId,
          lostItemId,
          foundItemId
        },
        update: {},
        include: conversationInclude
      });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations =
      await prisma.conversation.findMany({
        where: {
          OR: [
            {
              ownerId: req.user.id
            },
            {
              finderId: req.user.id
            }
          ]
        },
        include: conversationInclude,
        orderBy: {
          updatedAt: "desc"
        }
      });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);

    if (Number.isNaN(conversationId)) {
      return res.status(400).json({
        message:
          "Conversation id must be a valid number"
      });
    }

    const conversation =
      await prisma.conversation.findUnique({
        where: {
          id: conversationId
        }
      });

    if (
      !conversation ||
      !isParticipant(conversation, req.user.id)
    ) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: {
          not: req.user.id
        },
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    const messages =
      await prisma.message.findMany({
        where: {
          conversationId
        },
        include: messageInclude,
        orderBy: {
          createdAt: "asc"
        }
      });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    const body = req.body.body?.trim();

    if (Number.isNaN(conversationId) || !body) {
      return res.status(400).json({
        message:
          "Conversation and message are required"
      });
    }

    const conversation =
      await prisma.conversation.findUnique({
        where: {
          id: conversationId
        },
        include: {
          owner: {
            select: userSelect
          },
          finder: {
            select: userSelect
          }
        }
      });

    if (
      !conversation ||
      !isParticipant(conversation, req.user.id)
    ) {
      return res.status(404).json({
        message: "Conversation not found"
      });
    }

    const message =
      await prisma.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          body
        },
        include: messageInclude
      });

    const recipientId =
      conversation.ownerId === req.user.id
        ? conversation.finderId
        : conversation.ownerId;

    await createNotification({
      userId: recipientId,
      type: "NEW_MESSAGE",
      title: "New message",
      message: `${message.sender.name} sent you a message.`,
      link: `/messages/${conversationId}`
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

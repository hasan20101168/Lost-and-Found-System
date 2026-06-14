const prisma = require("../config/prisma");
const {
  calculateMatch
} = require("../utils/itemMatcher");
const {
  createNotification
} = require("./notification.service");

const MIN_NEW_MATCH_SCORE = 50;

const hasExistingMatchNotification = async (
  userId,
  link
) => {
  const existing =
    await prisma.notification.findFirst({
      where: {
        userId,
        type: "NEW_MATCH",
        link
      },
      select: {
        id: true
      }
    });

  return Boolean(existing);
};

const notifyMatchParticipants = async ({
  lostItem,
  foundItem,
  score
}) => {
  if (lostItem.userId === foundItem.userId) {
    return;
  }

  const link = `/matches?lostItemId=${lostItem.id}&foundItemId=${foundItem.id}`;

  const notifications = [
    {
      userId: lostItem.userId,
      title: "New possible match",
      message: `${foundItem.title} may match your lost item ${lostItem.title}. Match score: ${score}%.`
    },
    {
      userId: foundItem.userId,
      title: "New possible match",
      message: `${lostItem.title} may match your found item ${foundItem.title}. Match score: ${score}%.`
    }
  ];

  await Promise.all(
    notifications.map(async (notification) => {
      if (
        await hasExistingMatchNotification(
          notification.userId,
          link
        )
      ) {
        return null;
      }

      return createNotification({
        ...notification,
        type: "NEW_MATCH",
        link
      });
    })
  );
};

const notifyMatchesForLostItem = async (
  lostItem
) => {
  const foundItems =
    await prisma.foundItem.findMany({
      where: {
        status: "FOUND"
      }
    });

  await Promise.all(
    foundItems.map(async (foundItem) => {
      const match = calculateMatch(
        lostItem,
        foundItem
      );

      if (match.score < MIN_NEW_MATCH_SCORE) {
        return;
      }

      await notifyMatchParticipants({
        lostItem,
        foundItem,
        score: match.score
      });
    })
  );
};

const notifyMatchesForFoundItem = async (
  foundItem
) => {
  const lostItems =
    await prisma.lostItem.findMany({
      where: {
        status: "LOST"
      }
    });

  await Promise.all(
    lostItems.map(async (lostItem) => {
      const match = calculateMatch(
        lostItem,
        foundItem
      );

      if (match.score < MIN_NEW_MATCH_SCORE) {
        return;
      }

      await notifyMatchParticipants({
        lostItem,
        foundItem,
        score: match.score
      });
    })
  );
};

module.exports = {
  notifyMatchesForLostItem,
  notifyMatchesForFoundItem
};

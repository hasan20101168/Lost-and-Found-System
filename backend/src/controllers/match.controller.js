const prisma = require("../config/prisma");
const {
  buildMatches
} = require("../utils/itemMatcher");

const parsePositiveNumber = (
  value,
  fallback
) => {
  const parsed = Number(value);

  if (
    Number.isNaN(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  return parsed;
};

exports.getMatches = async (req, res) => {
  try {
    const lostItemId = req.query.lostItemId
      ? Number(req.query.lostItemId)
      : null;
    const foundItemId = req.query.foundItemId
      ? Number(req.query.foundItemId)
      : null;

    if (
      (lostItemId !== null &&
        Number.isNaN(lostItemId)) ||
      (foundItemId !== null &&
        Number.isNaN(foundItemId))
    ) {
      return res.status(400).json({
        message: "Item ids must be valid numbers"
      });
    }

    const minScore = parsePositiveNumber(
      req.query.minScore,
      30
    );
    const limit = parsePositiveNumber(
      req.query.limit,
      50
    );

    const [lostItems, foundItems] =
      await Promise.all([
        prisma.lostItem.findMany({
          where: {
            status: "LOST",
            ...(lostItemId ? { id: lostItemId } : {})
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.foundItem.findMany({
          where: {
            status: "FOUND",
            ...(foundItemId ? { id: foundItemId } : {})
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        })
      ]);

    const matches = buildMatches(
      lostItems,
      foundItems,
      {
        minScore,
        limit
      }
    );

    res.json({
      count: matches.length,
      matches
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

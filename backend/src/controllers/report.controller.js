const prisma = require("../config/prisma");

const reportItemModels = {
  LOST_ITEM: prisma.lostItem,
  FOUND_ITEM: prisma.foundItem
};

exports.createReport = async (req, res) => {
  try {
    const itemType = req.body.itemType?.toUpperCase();
    const itemId = Number(req.body.itemId);
    const reason = req.body.reason?.trim();
    const details = req.body.details?.trim() || null;

    if (!reportItemModels[itemType]) {
      return res.status(400).json({
        message:
          "Item type must be LOST_ITEM or FOUND_ITEM"
      });
    }

    if (Number.isNaN(itemId)) {
      return res.status(400).json({
        message: "Item id must be a valid number"
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "Report reason is required"
      });
    }

    const item =
      await reportItemModels[itemType].findUnique({
        where: {
          id: itemId
        }
      });

    if (!item) {
      return res.status(404).json({
        message: "Reported item not found"
      });
    }

    const report = await prisma.report.create({
      data: {
        itemType,
        itemId,
        reason,
        details,
        reporterId: req.user.id
      },
      include: {
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

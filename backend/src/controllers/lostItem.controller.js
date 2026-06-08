const prisma = require("../config/prisma");

exports.createLostItem = async (
  req,
  res
) => {
  try {
    const {
      title,
      description,
      category,
      location,
      dateLost,
      reward
    } = req.body;

    const parsedDateLost = new Date(dateLost);

    if (Number.isNaN(parsedDateLost.getTime())) {
      return res.status(400).json({
        message: "Invalid date lost"
      });
    }

    const parsedReward =
      reward === undefined || reward === ""
        ? null
        : Number(reward);

    if (
      parsedReward !== null &&
      Number.isNaN(parsedReward)
    ) {
      return res.status(400).json({
        message: "Reward must be a valid number"
      });
    }

    const item =
      await prisma.lostItem.create({
        data: {
          title,
          description,
          category,
          location,
          dateLost: parsedDateLost,
          reward: parsedReward,
          userId: req.user.id
        }
      });

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllLostItems = async (req, res) => {
  try {
    const items = await prisma.lostItem.findMany({
      include: {
        user: true
      }
    });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getLostItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item = await prisma.lostItem.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.updateLostItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item = await prisma.lostItem.update({
      where: { id },
      data: req.body
    });

    res.json(item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.deleteLostItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.lostItem.delete({
      where: { id }
    });

    res.json({
      message: "Lost item deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getMyLostItems = async (
  req,
  res
) => {
  try {
    const items =
      await prisma.lostItem.findMany({
        where: {
          userId: req.user.id
        },
        orderBy: {
          createdAt: "desc"
        }
      });

    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

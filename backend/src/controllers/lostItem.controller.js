const prisma = require("../config/prisma");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const {
  CloudinaryUploadError
} = require("../utils/uploadToCloudinary");
const {
  buildItemWhere,
  getOrderBy,
  sortByRelevance
} = require("../utils/itemSearch");
const {
  notifyMatchesForLostItem
} = require("../services/matchNotification.service");

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

    let imageUrl = null;

    if (req.file) {
      const missingCloudinaryConfig = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
      ].some((key) => !process.env[key]?.trim());

      if (missingCloudinaryConfig) {
        return res.status(500).json({
          message: "Cloudinary configuration is missing"
        });
      }

      let uploadResult;

      try {
        uploadResult =
          await uploadToCloudinary(req.file.buffer);
      } catch (error) {
        if (error instanceof CloudinaryUploadError) {
          return res.status(502).json({
            message: error.message,
            cloudinaryStatusCode: error.statusCode
          });
        }

        throw error;
      }

      imageUrl = uploadResult.secure_url;
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
          imageUrl,
          userId: req.user.id
        }
      });

    notifyMatchesForLostItem(item).catch(
      (error) => {
        console.error(
          "Match notification failed",
          error
        );
      }
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getAllLostItems = async (req, res) => {
  try {
    const keywordFields = [
      "title",
      "description",
      "category",
      "location"
    ];

    const items = await prisma.lostItem.findMany({
      where: buildItemWhere(req.query, {
        locationField: "location",
        dateField: "dateLost",
        keywordFields
      }),
      include: {
        user: true
      },
      orderBy: getOrderBy(req.query.sort)
    });

    const sortedItems =
      req.query.sort === "relevant"
        ? sortByRelevance(
            items,
            req.query.keyword,
            keywordFields
          )
        : items;

    res.json(sortedItems);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getLostItemFilters = async (req, res) => {
  try {
    const items = await prisma.lostItem.findMany({
      select: {
        category: true,
        location: true,
        status: true
      }
    });

    res.json({
      categories: [
        ...new Set(items.map((item) => item.category))
      ].sort(),
      locations: [
        ...new Set(items.map((item) => item.location))
      ].sort(),
      statuses: [
        ...new Set(items.map((item) => item.status))
      ].sort()
    });
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

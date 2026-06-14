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
  notifyMatchesForFoundItem
} = require("../services/matchNotification.service");

const validateFoundItem = (body) => {
  const requiredFields = [
    "title",
    "description",
    "category",
    "foundLocation",
    "dateFound",
    "storageLocation",
    "contactInfo"
  ];

  const missingField = requiredFields.find(
    (field) => !body[field]?.trim()
  );

  if (missingField) {
    return `${missingField} is required`;
  }

  return null;
};

const uploadFoundItemImage = async (file) => {
  if (!file) {
    return null;
  }

  const missingCloudinaryConfig = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ].some((key) => !process.env[key]?.trim());

  if (missingCloudinaryConfig) {
    throw new Error("Cloudinary configuration is missing");
  }

  const uploadResult =
    await uploadToCloudinary(
      file.buffer,
      "lost-and-found/found-items"
    );

  return uploadResult.secure_url;
};

exports.createFoundItem = async (req, res) => {
  try {
    const validationError =
      validateFoundItem(req.body);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const {
      title,
      description,
      category,
      foundLocation,
      dateFound,
      storageLocation,
      contactInfo
    } = req.body;

    const parsedDateFound =
      new Date(dateFound);

    if (Number.isNaN(parsedDateFound.getTime())) {
      return res.status(400).json({
        message: "Invalid date found"
      });
    }

    let imageUrl = null;

    try {
      imageUrl =
        await uploadFoundItemImage(req.file);
    } catch (error) {
      if (error instanceof CloudinaryUploadError) {
        return res.status(502).json({
          message: error.message,
          cloudinaryStatusCode: error.statusCode
        });
      }

      throw error;
    }

    const item =
      await prisma.foundItem.create({
        data: {
          title,
          description,
          category,
          foundLocation,
          dateFound: parsedDateFound,
          storageLocation,
          contactInfo,
          imageUrl,
          userId: req.user.id
        }
      });

    notifyMatchesForFoundItem(item).catch(
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

exports.getAllFoundItems = async (req, res) => {
  try {
    const keywordFields = [
      "title",
      "description",
      "category",
      "foundLocation",
      "storageLocation",
      "contactInfo"
    ];

    const items =
      await prisma.foundItem.findMany({
        where: buildItemWhere(req.query, {
          locationField: "foundLocation",
          dateField: "dateFound",
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

exports.getFoundItemFilters = async (req, res) => {
  try {
    const items =
      await prisma.foundItem.findMany({
        select: {
          category: true,
          foundLocation: true,
          status: true
        }
      });

    res.json({
      categories: [
        ...new Set(items.map((item) => item.category))
      ].sort(),
      locations: [
        ...new Set(items.map((item) => item.foundLocation))
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

exports.getFoundItemById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item =
      await prisma.foundItem.findUnique({
        where: { id },
        include: {
          user: true
        }
      });

    if (!item) {
      return res.status(404).json({
        message: "Found item not found"
      });
    }

    res.json(item);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getMyFoundItems = async (req, res) => {
  try {
    const items =
      await prisma.foundItem.findMany({
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

exports.updateFoundItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const item =
      await prisma.foundItem.update({
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

exports.deleteFoundItem = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.foundItem.delete({
      where: { id }
    });

    res.json({
      message: "Found item deleted"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

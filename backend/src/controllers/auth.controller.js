const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => {
  const {
    password,
    ...safeUser
  } = user;

  return safeUser;
};

const isAdminEmail = (email) =>
  process.env.ADMIN_EMAIL?.trim().toLowerCase() ===
  email?.trim().toLowerCase();

const loginAdminFromEnv = async (
  email,
  password
) => {
  if (
    !process.env.ADMIN_EMAIL?.trim() ||
    !process.env.ADMIN_PASSWORD?.trim() ||
    !isAdminEmail(email) ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD,
    10
  );

  return prisma.user.upsert({
    where: {
      email: process.env.ADMIN_EMAIL.trim()
    },
    update: {
      name:
        process.env.ADMIN_NAME?.trim() ||
        "Admin",
      password: hashedPassword,
      role: "ADMIN"
    },
    create: {
      name:
        process.env.ADMIN_NAME?.trim() ||
        "Admin",
      email: process.env.ADMIN_EMAIL.trim(),
      password: hashedPassword,
      role: "ADMIN"
    }
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (isAdminEmail(email)) {
      return res.status(403).json({
        message:
          "Admin account cannot be registered"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminUser =
      await loginAdminFromEnv(
        email,
        password
      );

    if (adminUser) {
      const token = generateToken(adminUser);

      return res.json({
        token,
        user: sanitizeUser(adminUser)
      });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id
    }
  });

  res.json(sanitizeUser(user));
};

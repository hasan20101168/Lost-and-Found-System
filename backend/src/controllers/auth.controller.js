const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const generateToken = require("../utils/generateToken");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      user
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
      user
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

  res.json(user);
};
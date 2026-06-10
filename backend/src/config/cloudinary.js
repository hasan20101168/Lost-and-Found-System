const { v2: cloudinary } = require("cloudinary");

const env = (key) =>
  process.env[key]?.trim();

cloudinary.config({
  cloud_name: env("CLOUDINARY_CLOUD_NAME"),
  api_key: env("CLOUDINARY_API_KEY"),
  api_secret: env("CLOUDINARY_API_SECRET")
});

module.exports = cloudinary;

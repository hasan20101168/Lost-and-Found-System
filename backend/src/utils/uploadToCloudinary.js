const cloudinary = require("../config/cloudinary");

class CloudinaryUploadError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "CloudinaryUploadError";
    this.statusCode = statusCode;
  }
}

const uploadToCloudinary = (
  fileBuffer,
  folder = "lost-and-found/lost-items"
) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image"
      },
      (error, result) => {
        if (error) {
          const statusCode =
            error.http_code || error.statusCode;

          const message =
            statusCode === 403
              ? "Cloudinary rejected the upload because this API key does not have create/upload permission."
              : "Image upload failed. Please check your Cloudinary cloud name, API key, and API secret.";

          reject(
            new CloudinaryUploadError(
              message,
              statusCode
            )
          );
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });

module.exports = uploadToCloudinary;
module.exports.CloudinaryUploadError = CloudinaryUploadError;

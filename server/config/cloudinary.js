import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { Readable } from "stream";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** File uploads are optional and need Cloudinary credentials in server/.env. */
export const isStorageConfigured = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const uploadStream = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    Readable.from(buffer).pipe(stream);
  });
};

export const uploadImage = (buffer, options = {}) => {
  return uploadStream(buffer, {
    resource_type: "image",
    ...options,
  });
};

export const uploadRaw = (buffer, options = {}) => {
  return uploadStream(buffer, {
    resource_type: "raw",
    ...options,
  });
};

export const deleteAsset = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("Error deleting Cloudinary asset:", error.message);
  }
};

export default cloudinary;


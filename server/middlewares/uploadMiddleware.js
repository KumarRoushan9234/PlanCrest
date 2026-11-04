import multer from "multer";

const storage = multer.memoryStorage();

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/svg+xml",
];

const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
];

const CHAT_ATTACHMENT_TYPES = [
  ...IMAGE_MIME_TYPES,
  ...DOCUMENT_MIME_TYPES,
  "application/json",
  "video/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
];

const createUploader = ({ allowedMimeTypes, maxSizeMB }) =>
  multer({
    storage,
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
      if (!allowedMimeTypes || allowedMimeTypes.length === 0) {
        return cb(null, true);
      }
      if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
      }
      cb(
        new multer.MulterError(
          "LIMIT_UNEXPECTED_FILE",
          `Invalid file type: ${file.mimetype}`
        )
      );
    },
  });

export const photoUpload = createUploader({
  allowedMimeTypes: IMAGE_MIME_TYPES,
  maxSizeMB: 5,
});

export const documentUpload = createUploader({
  allowedMimeTypes: [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES],
  maxSizeMB: 25,
});

export const chatAttachmentUpload = createUploader({
  allowedMimeTypes: CHAT_ATTACHMENT_TYPES,
  maxSizeMB: 50,
});

export const handleUploadError = (err, req, res, next) => {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large"
        : "Invalid file upload";
    return res.status(400).json({
      success: false,
      message,
      error: err.message,
    });
  }

  return res.status(400).json({
    success: false,
    message: err.message || "Upload failed",
  });
};


import express from "express";
import {
  uploadProfilePhoto,
  uploadDocument,
  uploadChatAttachment,
  listDocuments,
  deleteDocument,
  updateDocumentMetadata,
  getStorageStatus,
} from "../controllers/uploads.js";
import { requireSignin } from "../middlewares/index.js";
import {
  photoUpload,
  documentUpload,
  chatAttachmentUpload,
  handleUploadError,
} from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/profile-photo",
  requireSignin,
  photoUpload.single("file"),
  uploadProfilePhoto
);

router.post(
  "/document",
  requireSignin,
  documentUpload.single("file"),
  uploadDocument
);

router.post(
  "/chat-attachment",
  requireSignin,
  chatAttachmentUpload.single("file"),
  uploadChatAttachment
);

router.get("/status", requireSignin, getStorageStatus);
router.get("/documents", requireSignin, listDocuments);
router.delete("/documents/:documentId", requireSignin, deleteDocument);
router.patch("/documents/:documentId", requireSignin, updateDocumentMetadata);

// Multer error handler
router.use(handleUploadError);

export default router;


import mongoose from "mongoose";
import User from "../models/user.js";
import Attachment from "../models/attachment.js";
import { HttpError, getAccessibleProjectIds, getWorkspaceAccess } from "../utils/workspaceAccess.js";
import { uploadImage, uploadRaw, deleteAsset, isStorageConfigured } from "../config/cloudinary.js";

const fail = (res, error, fallback) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(fallback, error);
  return res.status(500).json({ success: false, message: fallback });
};

const requireStorage = () => {
  if (!isStorageConfigured()) {
    throw new HttpError(503, "File storage isn't configured. Add Cloudinary credentials to server/.env to enable uploads.");
  }
};

const getAccess = getWorkspaceAccess;
const accessibleProjectIds = getAccessibleProjectIds;

const buildAttachmentPayload = (file, uploadResult) => ({
  url: uploadResult.secure_url,
  publicId: uploadResult.public_id,
  resourceType: uploadResult.resource_type,
  format: uploadResult.format,
  folder: uploadResult.folder,
  bytes: uploadResult.bytes || file.size,
  version: uploadResult.version,
  width: uploadResult.width,
  height: uploadResult.height,
  originalName: file.originalname,
  filename: uploadResult.public_id?.split("/").pop() || file.originalname,
  mimeType: file.mimetype,
  size: file.size,
  thumbnailUrl: uploadResult.secure_url,
  provider: "cloudinary",
});

/** GET /api/uploads/status: lets the UI explain when storage isn't set up */
export const getStorageStatus = (req, res) => res.json({ success: true, enabled: isStorageConfigured() });

export const uploadProfilePhoto = async (req, res) => {
  try {
    const userId = req.auth._id;
    requireStorage();
    if (!req.file) throw new HttpError(400, "No file provided");

    const user = await User.findById(userId);
    if (!user) throw new HttpError(404, "User not found");

    const previousPublicId = user.avatar?.publicId;
    const result = await uploadImage(req.file.buffer, {
      folder: "users/profile_photos",
      transformation: [{ width: 512, height: 512, crop: "fill", gravity: "face" }],
    });

    user.avatar = {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      folder: result.folder,
      version: result.version,
    };
    await user.save();

    if (previousPublicId && previousPublicId !== result.public_id) {
      deleteAsset(previousPublicId, "image");
    }

    return res.json({
      success: true,
      message: "Profile photo updated",
      data: { avatar: user.avatar, user: await User.findById(userId) },
    });
  } catch (error) {
    return fail(res, error, "Failed to upload profile photo");
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { workspaceId, projectId } = req.body;
    requireStorage();
    if (!req.file) throw new HttpError(400, "No file provided");

    const access = await getAccess(workspaceId, userId);
    if (projectId) {
      const allowed = await accessibleProjectIds(workspaceId, userId, access);
      if (!allowed.some((id) => String(id) === String(projectId))) {
        throw new HttpError(403, "You don't have access to that project");
      }
    }

    const result = await uploadRaw(req.file.buffer, { folder: `documents/${workspaceId}` });
    const data = buildAttachmentPayload(req.file, result);

    const attachment = await Attachment.create({
      ...data,
      attachedTo: { model: "Document", id: workspaceId },
      project: projectId || null,
      workspace: workspaceId,
      uploadedBy: userId,
    });

    return res.status(201).json({ success: true, message: "Document uploaded successfully", data: attachment });
  } catch (error) {
    return fail(res, error, "Failed to upload document");
  }
};

export const uploadChatAttachment = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { workspaceId } = req.body;
    requireStorage();
    if (!req.file) throw new HttpError(400, "No file provided");
    if (workspaceId) await getAccess(workspaceId, userId);

    const folder = `chat_attachments/${workspaceId || "general"}`;
    const isImage = req.file.mimetype.startsWith("image/");
    const result = await (isImage ? uploadImage(req.file.buffer, { folder }) : uploadRaw(req.file.buffer, { folder }));

    return res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data: buildAttachmentPayload(req.file, result),
    });
  } catch (error) {
    return fail(res, error, "Failed to upload attachment");
  }
};

export const listDocuments = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { workspaceId, projectId } = req.query;

    const access = await getAccess(workspaceId, userId);
    const allowed = await accessibleProjectIds(workspaceId, userId, access);

    const filter = {
      workspace: workspaceId,
      "attachedTo.model": "Document",
      isDeleted: { $ne: true },
      // Workspace-wide files, plus files in projects this person can open
      $or: [{ project: null }, { project: { $exists: false } }, { project: { $in: allowed } }],
    };

    if (projectId) {
      if (!allowed.some((id) => String(id) === String(projectId))) {
        throw new HttpError(403, "You don't have access to that project");
      }
      delete filter.$or;
      filter.project = projectId;
    }

    const documents = await Attachment.find(filter)
      .populate("uploadedBy", "name email avatar")
      .populate("project", "name key")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: documents, canManageAll: access.isManager });
  } catch (error) {
    return fail(res, error, "Failed to fetch documents");
  }
};

const loadOwnedDocument = async (documentId, userId, verb) => {
  if (!mongoose.Types.ObjectId.isValid(documentId)) throw new HttpError(404, "Document not found");
  const document = await Attachment.findById(documentId);
  if (!document || document.isDeleted) throw new HttpError(404, "Document not found");

  const access = await getAccess(document.workspace, userId);
  if (!access.isManager && String(document.uploadedBy) !== String(userId)) {
    throw new HttpError(403, `Only the uploader or a workspace admin can ${verb} this file`);
  }
  return document;
};

export const deleteDocument = async (req, res) => {
  try {
    const document = await loadOwnedDocument(req.params.documentId, req.auth._id, "delete");

    if (document.publicId) {
      await deleteAsset(document.publicId, document.resourceType || "raw");
    }
    await document.deleteOne();

    return res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    return fail(res, error, "Failed to delete document");
  }
};

export const updateDocumentMetadata = async (req, res) => {
  try {
    const { name, description } = req.body;
    const document = await loadOwnedDocument(req.params.documentId, req.auth._id, "edit");

    if (name?.trim()) {
      document.originalName = name.trim();
      document.filename = name.trim();
    }
    if (description !== undefined) document.description = description;
    await document.save();

    return res.json({ success: true, message: "Document updated", data: document });
  } catch (error) {
    return fail(res, error, "Failed to update document");
  }
};

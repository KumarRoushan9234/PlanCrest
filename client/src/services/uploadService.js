import axios from "axios";

import { API_BASE_URL as API_URL } from "../config/api";

const multipartConfig = (onUploadProgress) => ({
  withCredentials: true,
  onUploadProgress,
});

const authConfig = {
  withCredentials: true,
};

export const uploadService = {
  // Is file storage (Cloudinary) configured on the server?
  getStatus: async () => {
    const response = await axios.get(`${API_URL}/uploads/status`, authConfig);
    return response.data;
  },

  uploadProfilePhoto: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/uploads/profile-photo`,
      formData,
      multipartConfig(onUploadProgress)
    );
    return response.data;
  },

  uploadDocument: async ({ file, workspaceId, projectId }, onUploadProgress) => {
    if (!workspaceId) {
      throw new Error("workspaceId is required to upload a document");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);
    if (projectId) {
      formData.append("projectId", projectId);
    }

    const response = await axios.post(
      `${API_URL}/uploads/document`,
      formData,
      multipartConfig(onUploadProgress)
    );
    return response.data;
  },

  uploadChatAttachment: async ({ file, workspaceId }, onUploadProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    if (workspaceId) {
      formData.append("workspaceId", workspaceId);
    }

    const response = await axios.post(
      `${API_URL}/uploads/chat-attachment`,
      formData,
      multipartConfig(onUploadProgress)
    );
    return response.data;
  },

  listDocuments: async (workspaceId, projectId) => {
    if (!workspaceId) {
      throw new Error("workspaceId is required to list documents");
    }

    const response = await axios.get(`${API_URL}/uploads/documents`, {
      ...authConfig,
      params: {
        workspaceId,
        projectId,
      },
    });
    return response.data;
  },

  deleteDocument: async (documentId) => {
    const response = await axios.delete(
      `${API_URL}/uploads/documents/${documentId}`,
      authConfig
    );
    return response.data;
  },

  updateDocument: async (documentId, payload) => {
    const response = await axios.patch(
      `${API_URL}/uploads/documents/${documentId}`,
      payload,
      authConfig
    );
    return response.data;
  },
};

export default uploadService;


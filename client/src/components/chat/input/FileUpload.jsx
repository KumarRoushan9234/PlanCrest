import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, X, Image, File, Loader2 } from "lucide-react";
import axios from "axios";

/**
 * File Upload Component
 * Handles file uploads to Cloudinary
 */
const FileUpload = ({ onFilesSelected, maxFiles = 5 }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    const uploadPromises = files.map(uploadToCloudinary);

    try {
      const results = await Promise.all(uploadPromises);
      const newFiles = results.filter(Boolean);
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      onFilesSelected([...uploadedFiles, ...newFiles]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload files");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "plancrest_chat"
      );
      formData.append("folder", "chat_attachments");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name"
        }/image/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        url: response.data.secure_url,
        publicId: response.data.public_id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        thumbnailUrl: response.data.secure_url,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      return null;
    }
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith("image/")) return Image;
    return File;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {uploadedFiles.map((file, index) => {
          const Icon = getFileIcon(file.mimeType);
          return (
            <motion.div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-300 truncate max-w-[100px]">
                {file.filename}
              </span>
              <motion.button
                onClick={() => removeFile(index)}
                className="p-0.5 hover:bg-gray-700 rounded"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-3 h-3 text-gray-400" />
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
        />
        <motion.button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || uploadedFiles.length >= maxFiles}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </motion.button>
        {uploadedFiles.length > 0 && (
          <span className="text-xs text-gray-500">
            {uploadedFiles.length}/{maxFiles} files
          </span>
        )}
      </div>
    </div>
  );
};

export default FileUpload;

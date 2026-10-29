import React from "react";
import { Download, FileText } from "lucide-react";
import { buildDownloadUrl, getMimeGroup } from "../../utils/fileUtils";

const FilePreviewRenderer = ({
  file = {},
  variant = "modal",
  onDownload,
  className = "",
}) => {
  const type = getMimeGroup(file.mimeType, file.originalName || file.filename);
  const downloadUrl = buildDownloadUrl(
    file.url,
    file.originalName || file.filename || "download"
  );

  if (type === "image") {
    return (
      <div
        className={`flex items-center justify-center bg-black/30 ${className}`}
      >
        <img
          src={file.url}
          alt={file.originalName || "Image"}
          className={
            variant === "chat"
              ? "max-h-64 rounded-lg object-contain"
              : "max-h-[70vh] rounded-xl shadow-2xl object-contain"
          }
        />
      </div>
    );
  }

  if (type === "video") {
    return (
      <div className={`bg-black/40 rounded-xl p-2 ${className}`}>
        <video
          controls
          src={file.url}
          className="w-full rounded-lg shadow-lg"
        />
      </div>
    );
  }

  if (type === "pdf") {
    return (
      <div className={`bg-black/30 ${className}`}>
        <iframe
          title="PDF preview"
          src={`${file.url}#toolbar=0&navpanes=0&scrollbar=0`}
          className={
            variant === "chat"
              ? "w-full h-64 rounded-lg border border-gray-800"
              : "w-full h-[70vh] rounded-xl border border-gray-900"
          }
        />
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-8 text-gray-300 bg-gray-900/40 rounded-xl border border-gray-800 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-3">
        <FileText className="w-7 h-7 text-blue-400" />
      </div>
      <p className="text-sm font-medium text-white mb-1">
        {file.originalName || file.filename}
      </p>
      <p className="text-xs text-gray-500 mb-4">
        No preview available for this file type.
      </p>
      <button
        onClick={() => (onDownload ? onDownload(downloadUrl) : window.open(downloadUrl, "_blank"))}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
      >
        <Download className="w-4 h-4" />
        Download File
      </button>
    </div>
  );
};

export default FilePreviewRenderer;


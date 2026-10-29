import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";

const getFileType = (doc) => {
  if (!doc) return "other";
  const mime = doc.mimeType || "";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "other";
};

const DocumentPreviewModal = ({ document, isOpen, onClose, onShare }) => {
  const [zoom, setZoom] = useState(1);

  const fileType = useMemo(() => getFileType(document), [document]);

  if (!document) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.6));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-5xl rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl flex flex-col max-h-[90vh]"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-blue-400 uppercase tracking-wide">
                  Document Preview
                </p>
                <h3 className="text-lg font-semibold text-white truncate max-w-[320px]">
                  {document.originalName || document.filename}
                </h3>
                <p className="text-xs text-gray-500">
                  {document.mimeType?.toUpperCase()} •{" "}
                  {document.size
                    ? `${(document.size / (1024 * 1024)).toFixed(2)} MB`
                    : "Size N/A"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {fileType === "image" && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onShare?.(document)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                >
                  Share
                </button>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href={document.url}
                  download={document.originalName || document.filename}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
                <button
                  onClick={() => {
                    setZoom(1);
                    onClose();
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {fileType === "image" && (
                <div className="h-full flex items-center justify-center bg-black/30 p-4">
                  <img
                    src={document.url}
                    alt={document.originalName || "Document preview"}
                    className="max-h-full max-w-full object-contain rounded-lg shadow-xl"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
              )}

              {fileType === "pdf" && (
                <div className="h-full">
                  <iframe
                    title="PDF Preview"
                    src={`${document.url}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="w-full h-full border-none"
                  />
                </div>
              )}

              {fileType === "other" && (
                <div className="h-full flex flex-col items-center justify-center text-center px-8 py-16 text-gray-300">
                  <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-white mb-1">
                    Preview not available
                  </p>
                  <p className="text-sm text-gray-400 mb-6">
                    This file type can’t be previewed, but you can download it
                    to view locally.
                  </p>
                  <div className="flex gap-3">
                    <a
                      href={document.url}
                      download={document.originalName || document.filename}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 text-gray-200 rounded-lg text-sm hover:bg-gray-900 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentPreviewModal;

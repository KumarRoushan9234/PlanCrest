export const buildDownloadUrl = (url = "", filename = "download") => {
  if (!url) return "";
  if (url.includes("/upload/")) {
    const parts = url.split("/upload/");
    if (parts[1].startsWith("fl_attachment")) {
      return url;
    }
    return `${parts[0]}/upload/fl_attachment:${encodeURIComponent(
      filename
    )}/${parts[1]}`;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}download=${encodeURIComponent(filename)}`;
};

export const getFileExtension = (name = "") => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const getMimeGroup = (mimeType = "", filename = "") => {
  const mime = mimeType || "";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "pdf";

  const ext = getFileExtension(filename);
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "other";
};


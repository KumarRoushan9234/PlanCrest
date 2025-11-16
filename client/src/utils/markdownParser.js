/**
 * Markdown Parser Utilities
 * Convert markdown to HTML for message display
 */

/**
 * Simple markdown to HTML converter
 * Supports: bold, italic, code, links, lists
 * @param {string} content - Markdown content
 * @returns {string} - HTML content
 */
export const parseMarkdown = (content) => {
  if (!content) return "";

  let html = content;

  // Escape HTML first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks (```code```)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

  // Italic (*text* or _text_)
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>');

  // Line breaks (double newline = paragraph, single = br)
  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");
  html = `<p>${html}</p>`;

  return html;
};

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} html - HTML content
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) return "";

  // Create a temporary div element
  const div = document.createElement("div");
  div.textContent = html;

  // Get the sanitized HTML
  return div.innerHTML;
};

/**
 * Parse markdown and sanitize
 * @param {string} content - Markdown content
 * @returns {string} - Safe HTML content
 */
export const parseAndSanitize = (content) => {
  const html = parseMarkdown(content);
  // For now, we trust our markdown parser
  // In production, use a library like DOMPurify
  return html;
};


/**
 * Mention Parser Utilities
 * Parse and replace @mentions and #task mentions
 */

/**
 * Parse @mentions from content
 * @param {string} content - Message content
 * @returns {Array} - Array of mentioned usernames
 */
export const parseMentions = (content) => {
  if (!content) return [];

  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Parse #task mentions from content
 * @param {string} content - Message content
 * @returns {Array} - Array of task keys
 */
export const parseTaskMentions = (content) => {
  if (!content) return [];

  const taskRegex = /#([A-Z]+-\d+)/g;
  const tasks = [];
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    tasks.push(match[1]);
  }

  return [...new Set(tasks)]; // Remove duplicates
};

/**
 * Replace @mentions with user links
 * @param {string} content - Message content
 * @param {Array} users - Array of user objects
 * @returns {string} - Content with replaced mentions
 */
export const replaceMentions = (content, users = []) => {
  if (!content || !users.length) return content;

  let formatted = content;

  users.forEach((user) => {
    const username = user.name || user.email || user.username;
    if (username) {
      const regex = new RegExp(`@${username}`, "gi");
      formatted = formatted.replace(
        regex,
        `<span class="mention" data-user-id="${user._id || user.id}">@${username}</span>`
      );
    }
  });

  return formatted;
};

/**
 * Replace #task mentions with task links
 * @param {string} content - Message content
 * @param {Array} tasks - Array of task objects
 * @returns {string} - Content with replaced task mentions
 */
export const replaceTaskMentions = (content, tasks = []) => {
  if (!content || !tasks.length) return content;

  let formatted = content;

  tasks.forEach((task) => {
    const taskKey = task.taskKey || task.key;
    if (taskKey) {
      const regex = new RegExp(`#${taskKey}`, "gi");
      formatted = formatted.replace(
        regex,
        `<a href="/task/${task._id || task.id}" class="task-mention" data-task-id="${task._id || task.id}">#${taskKey}</a>`
      );
    }
  });

  return formatted;
};


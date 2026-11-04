import Task from "../../models/task.js";
import { HttpError } from "../../utils/workspaceAccess.js";
import { call } from "../http.js";
import { markSynced } from "../store.js";
import { addExternalLink, guessStatus, importAsTasks } from "../taskImport.js";

const API = "https://api.trello.com/1";
const ID_RE = /^[a-f0-9]{24}$/i;

const trello = (connector, config) =>
  call({ ...config, url: `${API}${config.url}`, params: { ...config.params, key: connector.config.apiKey, token: connector.config.accessToken } });

const id = (value, label) => {
  if (!ID_RE.test(String(value || ""))) throw new HttpError(400, `Choose a ${label}`);
  return String(value);
};

export const validateTrello = async ({ apiKey, token }) => {
  if (!String(apiKey || "").trim() || !String(token || "").trim()) throw new HttpError(400, "Enter both your Trello API key and token");
  const me = await call({ url: `${API}/members/me`, params: { key: apiKey.trim(), token: token.trim(), fields: "fullName,username,avatarUrl" } });
  return {
    config: { apiKey: apiKey.trim(), accessToken: token.trim() },
    account: { name: me.fullName, username: me.username, picture: me.avatarUrl ? `${me.avatarUrl}/50.png` : undefined },
    name: `Trello (${me.username})`,
  };
};

export const trelloActions = {
  async boards(ctx) {
    const boards = await trello(ctx.connector, { url: "/members/me/boards", params: { fields: "name,url,closed", filter: "open" } });
    await markSynced(ctx.connector);
    return { boards: boards.map((b) => ({ id: b.id, name: b.name, url: b.url })) };
  },

  async lists(ctx, { boardId }) {
    const lists = await trello(ctx.connector, { url: `/boards/${id(boardId, "board")}/lists`, params: { fields: "name", filter: "open" } });
    return { lists: lists.map((l) => ({ id: l.id, name: l.name })) };
  },

  async import_cards(ctx, { boardId, projectId, listId }) {
    await ctx.project(projectId);
    const board = id(boardId, "board");
    const [lists, cards] = await Promise.all([
      trello(ctx.connector, { url: `/boards/${board}/lists`, params: { fields: "name" } }),
      trello(ctx.connector, { url: `/boards/${board}/cards`, params: { fields: "name,desc,due,idList,shortUrl,closed" } }),
    ]);
    const listName = new Map(lists.map((l) => [l.id, l.name]));
    const items = cards
      .filter((c) => !c.closed && (!listId || c.idList === listId))
      .map((c) => ({
        externalId: c.id,
        key: c.id.slice(-6),
        url: c.shortUrl,
        title: c.name,
        description: `${c.desc || ""}\n\n— Imported from ${c.shortUrl} (list: ${listName.get(c.idList) || "unknown"})`.trim(),
        status: guessStatus(listName.get(c.idList)),
        dueDate: c.due,
      }));
    const result = await importAsTasks({ userId: ctx.userId, projectId, provider: "trello", items });
    await markSynced(ctx.connector, `Imported ${result.created} cards`);
    return result;
  },

  async create_card(ctx, { listId, taskId }) {
    const task = await Task.findById(taskId);
    if (!task) throw new HttpError(404, "Task not found");
    await ctx.project(task.project);
    const card = await trello(ctx.connector, {
      method: "POST",
      url: "/cards",
      params: {
        idList: id(listId, "list"),
        name: task.title.slice(0, 500),
        desc: `${task.description || ""}\n\nCreated from PlanCrest task ${task.taskKey}`.trim(),
        due: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
        pos: "top",
      },
    });
    await addExternalLink(task._id, { provider: "trello", externalId: card.id, key: card.id.slice(-6), url: card.shortUrl, title: task.title });
    return { url: card.shortUrl };
  },
};

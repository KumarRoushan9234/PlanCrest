export const CATEGORIES = [
  { value: "meeting", label: "Meeting", color: "#4d8dff" },
  { value: "deadline", label: "Deadline", color: "#e5675f" },
  { value: "milestone", label: "Milestone", color: "#a98af0" },
  { value: "reminder", label: "Reminder", color: "#e8a93a" },
  { value: "event", label: "Event", color: "#3fb97f" },
  { value: "holiday", label: "Holiday", color: "#2dd4bf" },
  { value: "other", label: "Other", color: "#8a90a0" },
];

export const colorFor = (category) => CATEGORIES.find((c) => c.value === category)?.color || "#4d8dff";

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};

/** Every day shown in a month grid: whole weeks, Sunday first. */
export const monthGrid = (cursor) => {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const weeks = Math.ceil((first.getDay() + last.getDate()) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
};

export const timeLabel = (event) =>
  event.allDay ? "All day" : new Date(event.startDate).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

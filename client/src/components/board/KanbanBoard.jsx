import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { CalendarDays, CheckSquare } from "lucide-react";
import { BOARD_STATUSES } from "./boardConfig";
import { AvatarStack, Badge, PRIORITY_META, STATUS_META, cn, formatDate } from "../ui";

const dueTone = (task) => {
  if (!task.dueDate || task.status === "done") return "";
  const d = new Date(task.dueDate).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  return d < today ? "red" : d === today ? "amber" : "";
};

export function TaskCard({ task, onOpen, showProject = false, dragging = false }) {
  const tone = dueTone(task);
  return (
    <div className={cn("pc-taskcard", dragging && "dragging")} onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen?.()}>
      <div className="top">
        {task.taskKey && <span className="pc-mono pc-dim">{task.taskKey}</span>}
        {showProject && task.project?.name && <span className="pc-badge" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>{task.project.name}</span>}
        <span className="grow" />
        <span className="pc-dot" style={{ background: PRIORITY_META[task.priority]?.color }} title={`${PRIORITY_META[task.priority]?.label ?? ""} priority`} />
      </div>
      <div className="title">{task.title}</div>
      <div className="meta">
        {task.dueDate && (
          <Badge tone={tone}>
            <CalendarDays size={11} />
            {formatDate(task.dueDate)}
          </Badge>
        )}
        {task.subtaskCount > 0 && (
          <span className="chip" title="Subtasks done">
            <CheckSquare size={12} />
            {task.subtaskDone}/{task.subtaskCount}
          </span>
        )}
        <span className="grow" />
        <AvatarStack users={task.assignees || []} max={3} />
      </div>
    </div>
  );
}

/**
 * Status-column kanban board with drag and drop.
 * onMove(task, toStatus) is called after an optimistic local move; the parent persists it.
 */
export default function KanbanBoard({ tasks, onMove, onOpen, showProject = false, statuses = BOARD_STATUSES, emptyHint = "Drop tasks here" }) {
  const byStatus = Object.fromEntries(statuses.map((s) => [s, []]));
  for (const t of tasks) if (byStatus[t.status]) byStatus[t.status].push(t);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const task = tasks.find((t) => t._id === draggableId);
    if (task) onMove(task, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="pc-board">
        {statuses.map((status) => {
          const meta = STATUS_META[status];
          const items = byStatus[status];
          return (
            <section key={status} className="pc-col" aria-label={meta.label}>
              <header>
                <span className="pc-dot" style={{ background: meta.color }} />
                <b>{meta.label}</b>
                <span className="count">{items.length}</span>
              </header>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className={cn("pc-col-body", snapshot.isDraggingOver && "over")}>
                    {items.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(drag, state) => (
                          <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} style={drag.draggableProps.style}>
                            <TaskCard task={task} showProject={showProject} dragging={state.isDragging} onOpen={() => onOpen(task)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && !snapshot.isDraggingOver && <div className="pc-col-empty">{emptyHint}</div>}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}

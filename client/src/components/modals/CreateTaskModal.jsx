import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Plus, Trash2 } from "lucide-react";
import { projectService } from "../../services/projectService";
import { useWorkspace } from "../../contexts/WorkspaceContext";
import { useAuth } from "../../contexts/AuthContext";

const CreateTaskModal = ({ isOpen, onClose, project, onSuccess }) => {
  const { currentWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assignedTo: [],
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    if (isOpen && currentWorkspace && project) {
      fetchWorkspaceMembers();
      fetchBoards();
    }
  }, [isOpen, currentWorkspace, project]);

  const fetchWorkspaceMembers = async () => {
    try {
      const response = await projectService.getWorkspaceMembers(
        currentWorkspace._id
      );
      setWorkspaceMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching workspace members:", error);
    }
  };

  const fetchBoards = async () => {
    try {
      const response = await projectService.getProjectBoards(project._id);
      const boardList = response.data || [];
      setBoards(boardList);

      // Get the default board or first board
      const defaultBoard = boardList.find((b) => b.isDefault) || boardList[0];
      if (defaultBoard) {
        fetchColumns(defaultBoard._id);
      }
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  const fetchColumns = async (boardId) => {
    try {
      const response = await projectService.getBoardColumns(boardId);
      setColumns(response.data || []);
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      setLoading(true);

      // Find the column that matches the selected status
      const column =
        columns.find((col) => col.type === formData.status) || columns[0];
      if (!column) {
        alert("No columns available. Please contact support.");
        setLoading(false);
        return;
      }

      // Get the board ID
      const defaultBoard = boards.find((b) => b.isDefault) || boards[0];
      if (!defaultBoard) {
        alert("No board available. Please contact support.");
        setLoading(false);
        return;
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        boardId: defaultBoard._id,
        columnId: column._id,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignees: formData.assignedTo,
        subtasks: subtasks.map((st) => ({ title: st.title, completed: false })),
      };

      await projectService.createTask(project._id, taskData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
      });
      setSubtasks([]);
      setNewSubtask("");

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMsg =
        error.error || "Failed to create task. Please try again.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { title: newSubtask.trim(), completed: false },
      ]);
      setNewSubtask("");
    }
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const toggleAssignee = (userId) => {
    if (formData.assignedTo.includes(userId)) {
      setFormData({
        ...formData,
        assignedTo: formData.assignedTo.filter((id) => id !== userId),
      });
    } else {
      setFormData({
        ...formData,
        assignedTo: [...formData.assignedTo, userId],
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-lg z-50"
          ></motion.div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="rounded-2xl border w-full max-w-5xl max-h-[85vh] overflow-y-auto scrollbar-hide shadow-inner shadow-black/20"
              style={{
                background:
                  "linear-gradient(135deg, rgba(13, 13, 13, 0.6), rgba(26, 26, 46, 0.65), rgba(46, 26, 54, 0.6))",
                backdropFilter: "blur(100px)",
                borderColor: "rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-600">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
                    animate={{
                      scale: [1, 1.05, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 2,
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </motion.div>
                  <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {project?.name || "Project"}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Create New Task</span>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Task Details */}
                  <div className="space-y-6">
                    {/* Task Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Task Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                        placeholder="Enter task title"
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={6}
                        placeholder="Add task description..."
                        className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none backdrop-blur-sm"
                      />
                    </div>

                    {/* Status, Priority, Due Date */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData({ ...formData, status: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Priority
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              priority: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              dueDate: e.target.value,
                            })
                          }
                          className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Subtasks and Assignments */}
                  <div className="space-y-6">
                    {/* Subtasks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Subtasks
                      </label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubtask();
                              }
                            }}
                            placeholder="Add a subtask..."
                            className="flex-1 px-4 py-2 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                          />
                          <button
                            type="button"
                            onClick={handleAddSubtask}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {subtasks.length > 0 && (
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {subtasks.map((subtask, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-800 bg-opacity-50 rounded-lg"
                              >
                                <span className="text-white text-sm">
                                  {subtask.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubtask(index)}
                                  className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assign Members */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Assign Members
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {workspaceMembers.map((member) => {
                          const user = member.user || member;
                          const userId = user._id || member._id;
                          return (
                            <label
                              key={userId}
                              className="flex items-center gap-3 p-3 hover:bg-gray-700 bg-gray-800 bg-opacity-50 rounded-lg cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.assignedTo.includes(userId)}
                                onChange={() => toggleAssignee(userId)}
                                className="w-4 h-4 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                  {user.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">
                                    {user.name || "Unknown"}
                                  </p>
                                  <p className="text-gray-400 text-xs">
                                    {user.email || "No email"}
                                  </p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-600 border-opacity-50">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-800 bg-opacity-50 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? "Creating..." : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateTaskModal;

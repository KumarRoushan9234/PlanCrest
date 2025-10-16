import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  Trash2,
  Plus,
  CheckCircle2,
  Circle,
  Search,
  XCircle,
} from "lucide-react";
import { projectService } from "../../services/projectService";

const TaskDetailsModal = ({
  isOpen,
  onClose,
  task: initialTask,
  project,
  isAdmin,
  onSaved,
}) => {
  const [task, setTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [loading, setLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [assignedMembers, setAssignedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && initialTask && project) {
      loadTaskData();
      fetchProjectMembers();
    }
    // Lock body scroll while modal is open
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen, initialTask, project]);

  const loadTaskData = () => {
    setTask(initialTask);
    setFormData({
      title: initialTask.title || "",
      description: initialTask.description || "",
      status: initialTask.status || "todo",
      priority: initialTask.priority || "medium",
      dueDate: initialTask.dueDate
        ? new Date(initialTask.dueDate).toISOString().split("T")[0]
        : "",
    });
    setSubtasks(initialTask.subtasks || []);
    // Handle assignees - they might be in assignees or assignedTo field
    const taskAssignees = initialTask.assignees || initialTask.assignedTo || [];
    setAssignedMembers(taskAssignees);
  };

  const fetchProjectMembers = async () => {
    try {
      const response = await projectService.getProjectMembers(project._id);
      setProjectMembers(response.data || []);
    } catch (error) {
      console.error("Error fetching project members:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !task) return;

    try {
      setLoading(true);
      const taskData = {
        ...formData,
        subtasks,
        assignees: assignedMembers.map((m) => m.user?._id || m._id),
      };

      await projectService.updateTask(task._id, taskData);
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm("Are you sure you want to delete this task?")) return;

    try {
      setLoading(true);
      await projectService.deleteTask(task._id);
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([
        ...subtasks,
        { title: newSubtask.trim(), completed: false, priority: "medium" },
      ]);
      setNewSubtask("");
    }
  };

  const toggleSubtask = (index) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    setSubtasks(updated);
  };

  const removeSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const updateSubtaskPriority = (index, priority) => {
    const updated = [...subtasks];
    updated[index].priority = priority;
    setSubtasks(updated);
  };

  const handleAssignMember = (member) => {
    const userId = member.user?._id || member._id;
    const isAlreadyAssigned = assignedMembers.some(
      (m) => (m.user?._id || m._id) === userId
    );

    if (!isAlreadyAssigned) {
      setAssignedMembers([...assignedMembers, member]);
    }
    setShowMemberDropdown(false);
    setSearchTerm("");
  };

  const handleRemoveMember = (memberId) => {
    setAssignedMembers(
      assignedMembers.filter((m) => (m.user?._id || m._id) !== memberId)
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const filteredMembers = projectMembers.filter((member) => {
    const user = member.user || member;
    const name = user.name?.toLowerCase() || "";
    const email = user.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    const userId = user._id || member._id;
    const isAlreadyAssigned = assignedMembers.some(
      (m) => (m.user?._id || m._id) === userId
    );
    return (
      !isAlreadyAssigned && (name.includes(search) || email.includes(search))
    );
  });

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-[1000]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl border w-full max-w-[1200px] max-h-[95vh] overflow-hidden shadow-inner shadow-black/30 flex flex-col ring-1 ring-white/10"
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
                    Task Details
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {loading && !task ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
                  <form onSubmit={handleSubmit} className="p-6 pb-8">
                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Title & Description */}
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
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            required
                            disabled={!isAdmin}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
                            rows={8}
                            disabled={!isAdmin}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="Add task description..."
                          />
                        </div>
                      </div>

                      {/* Right Column - Status, Priority, Due Date */}
                      <div className="space-y-6">
                        {/* Status */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Status
                          </label>
                          <select
                            value={formData.status}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                status: e.target.value,
                              })
                            }
                            disabled={!isAdmin}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="review">Review</option>
                            <option value="done">Done</option>
                          </select>
                        </div>

                        {/* Priority */}
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
                            disabled={!isAdmin}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        {/* Due Date */}
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
                            disabled={!isAdmin}
                            className="w-full px-4 py-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subtasks Section - Full Width */}
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Subtasks
                      </label>

                      {/* Add New Subtask */}
                      {isAdmin && (
                        <div className="flex gap-2 mb-4">
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
                          <motion.button
                            type="button"
                            onClick={handleAddSubtask}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </motion.button>
                        </div>
                      )}

                      {/* Subtasks List */}
                      {subtasks.length > 0 ? (
                        <div className="space-y-2">
                          {subtasks.map((subtask, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-3 p-3 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg group"
                            >
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => isAdmin && toggleSubtask(index)}
                                disabled={!isAdmin}
                                className="flex-shrink-0"
                              >
                                {subtask.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                                )}
                              </button>

                              {/* Title */}
                              <span
                                className={`flex-1 text-white ${
                                  subtask.completed
                                    ? "line-through text-gray-500"
                                    : ""
                                }`}
                              >
                                {subtask.title}
                              </span>

                              {/* Priority Selector */}
                              {isAdmin && (
                                <select
                                  value={subtask.priority || "medium"}
                                  onChange={(e) =>
                                    updateSubtaskPriority(index, e.target.value)
                                  }
                                  className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="urgent">Urgent</option>
                                </select>
                              )}

                              {/* Priority Badge */}
                              <div
                                className={`w-2 h-2 rounded-full ${getPriorityColor(
                                  subtask.priority || "medium"
                                )}`}
                              />

                              {/* Delete Button */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => removeSubtask(index)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-400/10 rounded transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm text-center py-4">
                          No subtasks yet. Add one above!
                        </p>
                      )}
                    </div>

                    {/* Assigned Members Section - Full Width */}
                    <div className="mt-8">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Assigned Members
                      </label>

                      {/* Assigned Members Display */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {assignedMembers.map((member) => {
                          const user = member.user || member;
                          const userId = user._id || member._id;
                          return (
                            <motion.div
                              key={userId}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg group"
                            >
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white font-medium text-xs">
                                {user.name?.charAt(0).toUpperCase() || "?"}
                              </div>
                              <span className="text-white text-sm font-medium">
                                {user.name || "Unknown"}
                              </span>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(userId)}
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded transition-all"
                                >
                                  <XCircle className="w-3 h-3 text-white" />
                                </button>
                              )}
                            </motion.div>
                          );
                        })}
                        {assignedMembers.length === 0 && (
                          <p className="text-gray-500 text-sm">
                            No members assigned yet
                          </p>
                        )}
                      </div>

                      {/* Add Member Dropdown */}
                      {isAdmin && (
                        <div className="relative">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setShowMemberDropdown(true)}
                                placeholder="Search members to assign..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-800 bg-opacity-50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                              />
                            </div>
                            <motion.button
                              type="button"
                              onClick={() =>
                                setShowMemberDropdown(!showMemberDropdown)
                              }
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>

                          {/* Dropdown */}
                          {showMemberDropdown && filteredMembers.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                            >
                              {filteredMembers.map((member) => {
                                const user = member.user || member;
                                const userId = user._id || member._id;
                                return (
                                  <button
                                    key={userId}
                                    type="button"
                                    onClick={() => handleAssignMember(member)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                                      {user.name?.charAt(0).toUpperCase() ||
                                        "?"}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-white font-medium text-sm">
                                        {user.name || "Unknown"}
                                      </p>
                                      <p className="text-gray-400 text-xs">
                                        {user.email || "No email"}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    {isAdmin && (
                      <div className="flex justify-end mt-8 pt-6 border-t border-gray-600 border-opacity-50">
                        <motion.button
                          type="submit"
                          disabled={loading || !formData.title.trim()}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailsModal;

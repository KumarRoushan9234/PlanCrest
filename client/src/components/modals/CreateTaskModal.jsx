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
    projectId: "",
  });
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [columns, setColumns] = useState([]);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    if (isOpen && currentWorkspace) {
      // Reset state when opening
      if (!project) {
        setSelectedProject(null);
        setFormData((prev) => ({ ...prev, projectId: "" }));
        setBoards([]);
        setColumns([]);
      }

      fetchWorkspaceMembers();
      fetchAvailableProjects();

      // Set initial project if provided
      if (project) {
        setSelectedProject(project);
        setFormData((prev) => ({ ...prev, projectId: project._id }));
        fetchBoards(project._id);
      }
    }
  }, [isOpen, currentWorkspace, project]);

  const fetchWorkspaceMembers = async () => {
    try {
      // If project is selected, fetch project members only
      if (selectedProject?._id) {
        const response = await projectService.getProjectMembers(
          selectedProject._id
        );
        setWorkspaceMembers(response.data || []);
      } else {
        // Otherwise fetch workspace members
        const response = await projectService.getWorkspaceMembers(
          currentWorkspace._id
        );
        setWorkspaceMembers(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchAvailableProjects = async () => {
    try {
      const response = await projectService.getWorkspaceProjects(
        currentWorkspace._id
      );
      if (response?.success && response?.data) {
        // Filter projects where user can create tasks
        const userProjects = response.data.filter((proj) => {
          // For now, allow all projects in the workspace
          // TODO: Add proper permission checking later
          return proj && proj._id;
        });

        setAvailableProjects(userProjects);

        // Don't auto-select any project when opened from DashboardTopNav
        // The project prop will be set in the useEffect if provided from TasksPanel
      }
    } catch (error) {
      console.error("Error fetching available projects:", error);
    }
  };

  const fetchBoards = async (projectId) => {
    try {
      const targetProjectId = projectId || selectedProject?._id || project?._id;
      if (!targetProjectId) return;

      const response = await projectService.getProjectBoards(targetProjectId);
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

  const handleProjectChange = (projectId) => {
    const project = availableProjects.find((p) => p._id === projectId);
    setSelectedProject(project);
    setFormData((prev) => ({ ...prev, projectId, assignedTo: [] })); // Reset assignees
    if (project) {
      fetchBoards(project._id);
      // Fetch project members when project changes
      projectService
        .getProjectMembers(project._id)
        .then((response) => setWorkspaceMembers(response.data || []))
        .catch((error) =>
          console.error("Error fetching project members:", error)
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (!formData.projectId) {
      alert("Please select a project.");
      return;
    }

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
        status: formData.status || "todo",
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignees: formData.assignedTo,
        subtasks: subtasks.map((st) => ({ title: st.title, completed: false })),
      };

      await projectService.createTask(formData.projectId, taskData);

      // Reset form
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
        assignedTo: [],
        projectId: "",
      });
      setSubtasks([]);
      setNewSubtask("");
      setSelectedProject(null);

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
          {/* Backdrop - Completely cover everything */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-[99999] top-0 left-0 right-0 bottom-0 w-screen h-screen pointer-events-auto"
            style={{
              zIndex: 99999,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          ></motion.div>

          {/* Modal - Full screen */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100000] w-screen h-screen pointer-events-auto flex items-center justify-center p-4"
            style={{
              zIndex: 100000,
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            <div
              className="rounded-2xl border w-full max-w-6xl h-[90vh] overflow-hidden shadow-2xl flex flex-col mx-auto"
              style={{
                background:
                  "linear-gradient(135deg, rgba(5, 5, 8, 0.98), rgba(15, 15, 25, 0.98))",
                backdropFilter: "blur(20px)",
                borderColor: "rgba(59, 130, 246, 0.3)",
                boxShadow:
                  "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(59, 130, 246, 0.1)",
              }}
            >
              {/* Header - Fixed */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800/50 bg-gradient-to-r from-gray-900/80 to-gray-800/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                    <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Create New Task
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedProject?.name ||
                        (availableProjects.length > 0
                          ? "Select a project to continue"
                          : "No projects available")}
                    </p>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              {/* Form - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-6" noValidate>
                  {/* Project Selector */}
                  <div className="mb-5">
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Project <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => handleProjectChange(e.target.value)}
                      required
                      disabled={project !== null && project !== undefined}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-600"
                    >
                      <option value="">Select a project</option>
                      {availableProjects.map((proj) => {
                        const userMembership = Array.isArray(proj.members)
                          ? proj.members.find(
                              (member) =>
                                member.user?._id === currentUser._id ||
                                member.user === currentUser._id
                            )
                          : null;
                        const role = userMembership?.role || "member";
                        return (
                          <option key={proj._id} value={proj._id}>
                            {proj.name} ({role})
                          </option>
                        );
                      })}
                    </select>
                    {project && (
                      <p className="text-xs text-blue-400 mt-2">
                        ✓ Task will be created in this project
                      </p>
                    )}
                    {availableProjects.length === 0 && !project && (
                      <div className="mt-3 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <p className="text-xs text-yellow-400 font-medium">
                            No projects available
                          </p>
                        </div>
                        <p className="text-xs text-yellow-300 mt-1">
                          You need to be a member of a project to create tasks.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Left Column - Task Details (2 columns) */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Task Title */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                          Task Title <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          placeholder="Enter a descriptive task title..."
                          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-gray-600"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                          rows={3}
                          placeholder="Add detailed task description..."
                          className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        />
                      </div>

                      {/* Status, Priority, Due Date */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="done">Done</option>
                            <option value="backlog">Backlog</option>
                            <option value="blocked">Blocked</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
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
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Subtasks and Assignments (1 column) */}
                    <div className="space-y-4">
                      {/* Subtasks */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
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
                              className="flex-1 px-3 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                            <motion.button
                              type="button"
                              onClick={handleAddSubtask}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.button>
                          </div>

                          {subtasks.length > 0 && (
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                              {subtasks.map((subtask, index) => (
                                <motion.div
                                  key={`subtask-${index}-${subtask.title}`}
                                  className="flex items-center justify-between p-2 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-all"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  <span className="text-white text-xs">
                                    {subtask.title}
                                  </span>
                                  <motion.button
                                    type="button"
                                    onClick={() => handleRemoveSubtask(index)}
                                    className="p-1 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </motion.button>
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assign Members */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-300 mb-2">
                          Assign Members
                        </label>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto overflow-x-hidden">
                          {workspaceMembers.map((member, index) => {
                            const user = member.user || member;
                            const userId = user._id || member._id;
                            return (
                              <motion.label
                                key={`member-${userId}-${index}`}
                                className="flex items-center gap-2 p-2 hover:bg-gray-800/50 bg-gray-900/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-600"
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.assignedTo.includes(userId)}
                                  onChange={() => toggleAssignee(userId)}
                                  className="w-3.5 h-3.5 rounded border-gray-500 bg-gray-600 text-blue-500 focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                  {user.name?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white font-medium text-xs truncate">
                                    {user.name || "Unknown"}
                                  </p>
                                  <p className="text-gray-400 text-xs truncate">
                                    {user.email || "No email"}
                                  </p>
                                </div>
                              </motion.label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Actions - Fixed at Bottom */}
              <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-3 bg-gradient-to-r from-gray-900/50 to-gray-900/30 border-t border-gray-800">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={
                    loading || !formData.title.trim() || !formData.projectId
                  }
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/25 cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "Creating..." : "Create Task"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateTaskModal;

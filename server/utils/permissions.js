// Permission checking utilities for workspace and project access

export const WORKSPACE_ROLES = {
  OWNER: "owner",
  ADMIN: "admin",
  EMPLOYEE: "employee",
  CLIENT: "client",
};

export const PROJECT_ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  VIEWER: "viewer",
};

/**
 * Get effective permissions for a workspace member
 * Combines workspace defaults with custom permissions
 */
export const getWorkspacePermissions = (member, workspace) => {
  const role = member.role;
  
  // Owner has all permissions
  if (role === WORKSPACE_ROLES.OWNER) {
    return {
      canManageWorkspace: true,
      canDeleteWorkspace: true,
      canManageBilling: true,
      canManageMembers: true,
      canInviteMembers: true,
      canCreateProjects: true,
      canDeleteProjects: true,
      canManageSettings: true,
      canManageIntegrations: true,
      canAccessAllProjects: true,
      canManageAdmins: true,
      canManageEmployees: true,
      canManageClients: true,
      canAccessAnalytics: true,
    };
  }
  
  // Admin permissions
  if (role === WORKSPACE_ROLES.ADMIN) {
    const defaults = workspace.settings?.adminPermissions || {};
    const custom = member.customPermissions?.admin || {};
    
    return {
      canManageWorkspace: false,
      canDeleteWorkspace: false,
      canManageBilling: custom.canManageBilling ?? defaults.canManageBilling ?? false,
      canManageMembers: true,
      canInviteMembers: true,
      canCreateProjects: custom.canCreateProjects ?? defaults.canCreateProjects ?? true,
      canDeleteProjects: custom.canDeleteProjects ?? defaults.canDeleteProjects ?? false,
      canManageSettings: false,
      canManageIntegrations: custom.canManageIntegrations ?? defaults.canManageIntegrations ?? true,
      canAccessAllProjects: false, // Only assigned projects
      canManageAdmins: false,
      canManageEmployees: custom.canManageEmployees ?? defaults.canManageEmployees ?? true,
      canManageClients: custom.canManageClients ?? defaults.canManageClients ?? true,
      canAccessAnalytics: custom.canAccessAnalytics ?? defaults.canAccessAnalytics ?? true,
    };
  }
  
  // Employee permissions
  if (role === WORKSPACE_ROLES.EMPLOYEE) {
    const defaults = workspace.settings?.employeePermissions || {};
    const custom = member.customPermissions?.employee || {};
    
    return {
      canManageWorkspace: false,
      canDeleteWorkspace: false,
      canManageBilling: false,
      canManageMembers: false,
      canInviteMembers: false,
      canCreateProjects: false,
      canDeleteProjects: false,
      canManageSettings: false,
      canManageIntegrations: false,
      canAccessAllProjects: false, // Only assigned projects
      canCreateTasks: custom.canCreateTasks ?? defaults.canCreateTasks ?? true,
      canDeleteTasks: custom.canDeleteTasks ?? defaults.canDeleteTasks ?? false,
      canCreateDocs: custom.canCreateDocs ?? defaults.canCreateDocs ?? true,
      canDeleteDocs: custom.canDeleteDocs ?? defaults.canDeleteDocs ?? false,
      canUseChat: custom.canUseChat ?? defaults.canUseChat ?? true,
      canTrackTime: custom.canTrackTime ?? defaults.canTrackTime ?? true,
      canUploadFiles: custom.canUploadFiles ?? defaults.canUploadFiles ?? true,
      canInviteClients: custom.canInviteClients ?? defaults.canInviteClients ?? false,
      canViewAnalytics: custom.canViewAnalytics ?? defaults.canViewAnalytics ?? false,
    };
  }
  
  // Client permissions
  if (role === WORKSPACE_ROLES.CLIENT) {
    const defaults = workspace.settings?.clientPermissions || {};
    const custom = member.customPermissions?.client || {};
    
    return {
      canManageWorkspace: false,
      canDeleteWorkspace: false,
      canManageBilling: false,
      canManageMembers: false,
      canInviteMembers: false,
      canCreateProjects: false,
      canDeleteProjects: false,
      canManageSettings: false,
      canManageIntegrations: false,
      canAccessAllProjects: false, // Only specifically approved projects
      canViewTasks: custom.canViewTasks ?? defaults.canViewTasks ?? true,
      canCommentOnTasks: custom.canCommentOnTasks ?? defaults.canCommentOnTasks ?? true,
      canCreateTasks: custom.canCreateTasks ?? defaults.canCreateTasks ?? false,
      canViewDocs: custom.canViewDocs ?? defaults.canViewDocs ?? true,
      canCommentOnDocs: custom.canCommentOnDocs ?? defaults.canCommentOnDocs ?? true,
      canUploadFiles: custom.canUploadFiles ?? defaults.canUploadFiles ?? true,
      canUseChat: custom.canUseChat ?? defaults.canUseChat ?? false,
      canViewProgress: custom.canViewProgress ?? defaults.canViewProgress ?? true,
    };
  }
  
  return {};
};

/**
 * Check if user has workspace permission
 */
export const hasWorkspacePermission = (member, workspace, permission) => {
  const permissions = getWorkspacePermissions(member, workspace);
  return permissions[permission] || false;
};

/**
 * Check if user is workspace owner
 */
export const isWorkspaceOwner = (workspace, userId) => {
  return workspace.owner.toString() === userId.toString();
};

/**
 * Check if user is workspace admin or owner
 */
export const isWorkspaceAdminOrOwner = (memberRole) => {
  return (
    memberRole === WORKSPACE_ROLES.OWNER || 
    memberRole === WORKSPACE_ROLES.ADMIN
  );
};

/**
 * Check if user can manage another user based on role hierarchy
 * Owner > Admin > Employee > Client
 */
export const canManageRole = (managerRole, targetRole) => {
  const hierarchy = {
    [WORKSPACE_ROLES.OWNER]: 4,
    [WORKSPACE_ROLES.ADMIN]: 3,
    [WORKSPACE_ROLES.EMPLOYEE]: 2,
    [WORKSPACE_ROLES.CLIENT]: 1,
  };
  
  return hierarchy[managerRole] > hierarchy[targetRole];
};

/**
 * Check if user can access project
 */
export const canAccessProject = (project, projectMember, workspaceMember) => {
  // Owner and Admin can access all public projects
  if (
    workspaceMember.role === WORKSPACE_ROLES.OWNER || 
    workspaceMember.role === WORKSPACE_ROLES.ADMIN
  ) {
    if (project.privacy === "public") {
      return true;
    }
  }
  
  // For private projects or employees/clients, check project membership
  if (projectMember && projectMember.status === "active") {
    return true;
  }
  
  // For employees/clients, check if project is in assignedProjects
  if (
    workspaceMember.role === WORKSPACE_ROLES.EMPLOYEE || 
    workspaceMember.role === WORKSPACE_ROLES.CLIENT
  ) {
    const isAssigned = workspaceMember.assignedProjects?.some(
      (ap) => ap.project.toString() === project._id.toString()
    );
    return isAssigned;
  }
  
  return false;
};

/**
 * Check if user can manage project
 */
export const canManageProject = (projectMember, workspaceMember) => {
  // Workspace owner and admin can manage
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Project admin can manage
  return projectMember?.role === PROJECT_ROLES.ADMIN;
};

/**
 * Check if user can create tasks in project
 */
export const canCreateTasks = (projectMember, workspaceMember, workspace) => {
  // Owner and Admin can always create tasks
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Check employee permissions
  if (workspaceMember.role === WORKSPACE_ROLES.EMPLOYEE) {
    const permissions = getWorkspacePermissions(workspaceMember, workspace);
    return permissions.canCreateTasks && projectMember?.permissions?.canCreateTasks !== false;
  }
  
  // Check client permissions
  if (workspaceMember.role === WORKSPACE_ROLES.CLIENT) {
    const permissions = getWorkspacePermissions(workspaceMember, workspace);
    return permissions.canCreateTasks && projectMember?.permissions?.canCreateTasks === true;
  }
  
  return projectMember?.permissions?.canCreateTasks !== false;
};

/**
 * Check if user can delete tasks
 */
export const canDeleteTasks = (projectMember, workspaceMember, workspace) => {
  // Owner and Admin can delete
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Check permissions
  if (workspaceMember.role === WORKSPACE_ROLES.EMPLOYEE) {
    const permissions = getWorkspacePermissions(workspaceMember, workspace);
    return permissions.canDeleteTasks && projectMember?.permissions?.canDeleteTasks === true;
  }
  
  return false;
};

/**
 * Check if user can edit task
 */
export const canEditTask = (task, userId, projectMember, workspaceMember, workspace) => {
  // Workspace owner/admin can always edit
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Project admin can edit
  if (projectMember?.role === PROJECT_ROLES.ADMIN) {
    return true;
  }
  
  // Task creator can edit
  if (task.createdBy.toString() === userId.toString()) {
    return true;
  }
  
  // Check project member permissions
  return projectMember?.permissions?.canEditTasks !== false;
};

/**
 * Check if user can create documents
 */
export const canCreateDocs = (projectMember, workspaceMember, workspace) => {
  // Owner and Admin can create docs
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Check employee permissions
  if (workspaceMember.role === WORKSPACE_ROLES.EMPLOYEE) {
    const permissions = getWorkspacePermissions(workspaceMember, workspace);
    return permissions.canCreateDocs && projectMember?.permissions?.canCreateDocs !== false;
  }
  
  return false;
};

/**
 * Check if user can access client portal features
 */
export const canManageClientAccess = (workspaceMember, projectMember) => {
  // Owner and Admin can manage client access
  if (isWorkspaceAdminOrOwner(workspaceMember.role)) {
    return true;
  }
  
  // Employees with permission can manage
  if (workspaceMember.role === WORKSPACE_ROLES.EMPLOYEE) {
    return projectMember?.permissions?.canManageClientAccess === true;
  }
  
  return false;
};

export default {
  WORKSPACE_ROLES,
  PROJECT_ROLES,
  getWorkspacePermissions,
  hasWorkspacePermission,
  isWorkspaceOwner,
  isWorkspaceAdminOrOwner,
  canManageRole,
  canAccessProject,
  canManageProject,
  canCreateTasks,
  canDeleteTasks,
  canEditTask,
  canCreateDocs,
  canManageClientAccess,
};

import Workspace from "../models/workspace.js";
import { getAccessibleProjects } from "../utils/projectAccess.js";
import { withTaskExtras } from "../utils/taskQueries.js";
import WorkspaceMember from "../models/workspaceMember.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import Task from "../models/task.js";
import ActivityLog from "../models/activityLog.js";
import TaskAssignment from "../models/taskAssignment.js";
import { nanoid } from "nanoid";
import { sendSimpleEmail } from "../utils/mailService.js";
import { sendInvitationAcceptedEmail } from "../utils/emailTemplates.js";
import { updateLastSelectedWorkspace, getLastSelectedItems } from "../utils/lastSelected.js";
import { createDefaultWorkspaceChannel } from "../utils/channelHelpers.js";

/**
 * Create a new workspace
 */
export const createWorkspace = async (req, res) => {
  try {
    const { name, description, companyInfo } = req.body;
    const userId = req.auth._id;

    // Validation
    if (!name) {
      return res.status(400).json({ error: "Workspace name is required" });
    }

    // Generate unique slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + nanoid(6);

    // Create workspace
    const workspace = new Workspace({
      name,
      slug,
      description,
      companyInfo,
      owner: userId,
    });

    await workspace.save();

    // Add creator as workspace member
    const workspaceMember = new WorkspaceMember({
      workspace: workspace._id,
      user: userId,
      role: "owner",
      status: "active",
      joinedAt: new Date(),
    });
    await workspaceMember.save();

    // Create default workspace channel
    try {
      await createDefaultWorkspaceChannel(workspace._id, userId);
    } catch (channelError) {
      console.error("Error creating default workspace channel:", channelError);
      // Don't fail workspace creation if channel fails
    }

    // Update user's last selected workspace
    await updateLastSelectedWorkspace(userId, {
      id: workspace._id,
      name: workspace.name,
    });

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (error) {
    console.error("Error creating workspace:", error);
    res.status(500).json({ error: "Failed to create workspace" });
  }
};

/**
 * Get all workspaces for current user
 */
export const getUserWorkspaces = async (req, res) => {
  try {
    const userId = req.auth._id;

    // Get workspaces where user is owner
    const ownedWorkspaces = await Workspace.find({
      owner: userId,
      status: "active",
    }).select("name slug description logo createdAt");

    // Get workspaces where user is a member
    const memberships = await WorkspaceMember.find({
      user: userId,
      status: "active",
    }).populate("workspace", "name slug description logo createdAt");

    const memberWorkspaces = memberships
      .filter(m => m.workspace)
      .map(m => ({
        ...m.workspace.toObject(),
        role: m.role,
      }));

    // Combine and deduplicate
    const allWorkspaces = [
      ...ownedWorkspaces.map(w => ({ ...w.toObject(), role: "owner" })),
      ...memberWorkspaces,
    ];

    res.json({
      success: true,
      message: "Workspaces fetched successfully",
      data: allWorkspaces,
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
};

/**
 * Get workspace details
 */
export const getWorkspace = async (req, res) => {
  try {
    // Workspace already attached by middleware - reuse it
    const workspace = req.workspace;
    const member = req.workspaceMember;
    const isOwner = req.isWorkspaceOwner;

    // Update user's last selected workspace
    await updateLastSelectedWorkspace(req.auth._id, {
      id: workspace._id,
      name: workspace.name,
    });

    // Add user's role to response
    const workspaceData = {
      ...workspace.toObject(),
      userRole: isOwner ? "owner" : member?.role,
    };

    res.json({
      success: true,
      message: "Workspace fetched successfully",
      data: workspaceData,
    });
  } catch (error) {
    console.error("Error fetching workspace:", error);
    res.status(500).json({ error: "Failed to fetch workspace" });
  }
};

/**
 * Update workspace
 */
export const updateWorkspace = async (req, res) => {
  try {
    const { name, description, companyInfo, logo } = req.body;
    // Workspace already attached by middleware
    const workspace = req.workspace;

    // Update fields
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (companyInfo) workspace.companyInfo = { ...workspace.companyInfo, ...companyInfo };
    if (logo !== undefined) workspace.logo = logo;

    await workspace.save();

    res.json({
      success: true,
      message: "Workspace updated successfully",
      data: workspace,
    });
  } catch (error) {
    console.error("Error updating workspace:", error);
    res.status(500).json({ error: "Failed to update workspace" });
  }
};

/**
 * Delete workspace (archive)
 */
export const deleteWorkspace = async (req, res) => {
  try {
    // Workspace already attached by middleware
    const workspace = req.workspace;

    // Archive instead of delete
    workspace.status = "archived";
    await workspace.save();

    res.json({
      success: true,
      message: "Workspace archived successfully",
    });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
};

/**
 * Get workspace members
 */
export const getWorkspaceMembers = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;
    const workspace = req.workspace; // Already fetched

    // Get all members with user details
    const members = await WorkspaceMember.find({
      workspace: workspaceId,
      status: "active",
    }).populate("user", "name email avatar title department");

    // Build project membership map for members in this workspace
    const projectsInWorkspace = await (await import("../models/project.js")).default
      .find({ workspace: workspaceId })
      .select("_id name");

    const ProjectMember = (await import("../models/projectMember.js")).default;

    // Helper to load a user's projects within this workspace
    const loadUserProjects = async (userId) => {
      const memberships = await ProjectMember.find({ user: userId, status: "active" })
        .select("project role")
        .populate({ path: "project", select: "_id name workspace" });
      return memberships
        .filter((m) => m.project && m.project.workspace?.toString() === workspaceId.toString())
        .map((m) => ({ _id: m.project._id, name: m.project.name, role: m.role }));
    };

    // Add owner to the list
    const owner = await User.findById(workspace.owner).select("name email avatar title department");
    
    const ownerProjects = owner ? await loadUserProjects(owner._id) : [];

    const allMembers = [
      owner && {
        user: owner,
        role: "owner",
        joinedAt: workspace.createdAt,
        status: "active",
        projects: ownerProjects,
      },
      ...(
        await Promise.all(
          // the owner is listed once, above, even though they also have a membership record
          members.filter((m) => String(m.user?._id) !== String(workspace.owner)).map(async (m) => ({
            _id: m._id,
            user: m.user,
            role: m.role,
            joinedAt: m.joinedAt,
            status: m.status,
            customPermissions: m.customPermissions,
            projects: await loadUserProjects(m.user?._id),
          }))
        )
      ),
    ].filter(Boolean);

    res.json({
      success: true,
      message: "Workspace members fetched successfully",
      data: allMembers,
    });
  } catch (error) {
    console.error("Error fetching workspace members:", error);
    res.status(500).json({ error: "Failed to fetch workspace members" });
  }
};

/**
 * Add member to workspace
 */
export const addWorkspaceMember = async (req, res) => {
  try {
    const { userId, role, customPermissions } = req.body;
    const workspaceId = req.params.workspaceId;
    const addedBy = req.auth._id;

    // Validation
    if (!userId || !role) {
      return res.status(400).json({ error: "User ID and role are required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already a member
    const existingMember = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
    });

    if (existingMember) {
      if (existingMember.status === "removed") {
        // Reactivate member
        existingMember.status = "active";
        existingMember.role = role;
        existingMember.joinedAt = new Date();
        if (customPermissions) existingMember.customPermissions = customPermissions;
        await existingMember.save();

        return res.json({
          success: true,
          message: "Member reactivated successfully",
          data: existingMember,
        });
      }
      return res.status(400).json({ error: "User is already a workspace member" });
    }

    // Create new member
    const member = new WorkspaceMember({
      workspace: workspaceId,
      user: userId,
      role,
      customPermissions,
      invitedBy: addedBy,
    });

    await member.save();

    // Populate user data for response
    await member.populate("user", "name email avatar");

    res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error adding workspace member:", error);
    res.status(500).json({ error: "Failed to add workspace member" });
  }
};

/**
 * Update member role and permissions
 */
export const updateWorkspaceMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, customPermissions } = req.body;
    const workspaceId = req.params.workspaceId;

    // Find member
    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "active",
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Role changes can never create or remove an owner, and admins are managed by the owner
    if (role && !["admin", "employee", "client"].includes(role)) {
      return res.status(400).json({ error: "Role must be admin, employee or client" });
    }
    if (String(userId) === String(req.workspace.owner)) {
      return res.status(403).json({ error: "The workspace owner's role can't be changed" });
    }
    if (!req.isWorkspaceOwner && (role === "admin" || member.role === "admin")) {
      return res.status(403).json({ error: "Only the workspace owner can manage admins" });
    }

    // Update fields
    if (role) member.role = role;
    if (customPermissions) member.customPermissions = { ...member.customPermissions, ...customPermissions };

    await member.save();

    res.json({
      success: true,
      message: "Member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error updating workspace member:", error);
    res.status(500).json({ error: "Failed to update workspace member" });
  }
};

/**
 * Remove member from workspace
 */
export const removeWorkspaceMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const workspaceId = req.params.workspaceId;

    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }
    if (String(userId) === String(req.workspace.owner)) {
      return res.status(403).json({ error: "The workspace owner can't be removed" });
    }
    if (!req.isWorkspaceOwner && member.role === "admin") {
      return res.status(403).json({ error: "Only the workspace owner can remove an admin" });
    }

    // Mark as removed instead of deleting
    member.status = "removed";
    await member.save();

    res.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing workspace member:", error);
    res.status(500).json({ error: "Failed to remove workspace member" });
  }
};

/**
 * Cancel a pending invitation
 * DELETE /api/workspaces/:workspaceId/invitations/:invitationId
 */
export const cancelInvitation = async (req, res) => {
  try {
    const invitation = await WorkspaceInvitation.findOneAndUpdate(
      { _id: req.params.invitationId, workspace: req.params.workspaceId, status: "pending" },
      { status: "cancelled" },
      { new: true }
    );
    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }
    res.json({ success: true, message: "Invitation cancelled" });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    res.status(500).json({ error: "Failed to cancel invitation" });
  }
};

/**
 * Invite user to workspace
 */
export const inviteToWorkspace = async (req, res) => {
  try {
    const { email, role, message } = req.body;
    const workspaceId = req.params.workspaceId;
    const invitedBy = req.auth._id;
    const workspace = req.workspace; // Already fetched

    // Validation
    if (!email || !role) {
      return res.status(400).json({ error: "Email and role are required" });
    }

    // Check if user already exists in workspace
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const existingMember = await WorkspaceMember.findOne({
        workspace: workspaceId,
        user: existingUser._id,
        status: "active",
      });

      if (existingMember) {
        return res.status(400).json({ 
          error: "User is already a member of this workspace",
          details: {
            userName: existingUser.name,
            userEmail: existingUser.email,
            role: existingMember.role,
            joinedAt: existingMember.joinedAt
          }
        });
      }
    }

    // Check for existing pending invitation
    const existingInvite = await WorkspaceInvitation.findOne({
      workspace: workspaceId,
      email,
      status: "pending",
    });

    if (existingInvite) {
      return res.status(400).json({ 
        error: "Invitation already sent to this email",
        details: {
          sentAt: existingInvite.createdAt,
          expiresAt: existingInvite.expiresAt,
          token: existingInvite.token
        }
      });
    }

    // Generate unique token
    const token = nanoid(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days expiry

    // Create invitation
    const invitation = new WorkspaceInvitation({
      workspace: workspaceId,
      email,
      role,
      message,
      token,
      invitedBy,
      expiresAt,
    });

    await invitation.save();

    // Send invitation email (non-blocking with timeout)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/invite/${token}`;
    const inviter = await User.findById(invitedBy);

    console.log(`📧 Sending invitation email to: ${email}`);
    console.log(`📧 Invite URL: ${inviteUrl}`);
    
    // Send email asynchronously without blocking the response
    sendSimpleEmail({
      to: email,
      subject: `Invitation to join ${workspace.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">Workspace Invitation</h2>
            <p style="color: #666; line-height: 1.6;">
              <strong>${inviter.name}</strong> has invited you to join <strong>${workspace.name}</strong>
            </p>
            ${message ? `<p style="color: #666; font-style: italic; background: #e9ecef; padding: 15px; border-radius: 4px; margin: 15px 0;"><em>"${message}"</em></p>` : ''}
            <p style="color: #666; line-height: 1.6;">
              You will be joining as: <strong style="color: #6366f1;">${role}</strong>
            </p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${inviteUrl}" style="background: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              This invitation expires in 14 days.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #666; font-size: 11px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `${inviter.name} has invited you to join ${workspace.name}. You will be joining as ${role}. ${message ? `Message: ${message}` : ''} Accept the invitation: ${inviteUrl}`
    })
    .then((emailResult) => {
      if (emailResult.success) {
        console.log(`✅ Invitation email sent successfully to: ${email}`);
      } else {
        console.error(`❌ Failed to send invitation email:`, emailResult.error);
      }
    })
    .catch((emailError) => {
      console.error(`❌ Email sending error:`, emailError.message);
      // Don't fail the request if email fails
    });

    // Return response immediately, don't wait for email
    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: { email, role, token, inviteUrl },
    });
  } catch (error) {
    console.error("Error inviting to workspace:", error);
    res.status(500).json({ error: "Failed to send invitation" });
  }
};

/**
 * Get pending invitations
 */
export const getWorkspaceInvitations = async (req, res) => {
  try {
    const workspaceId = req.params.workspaceId;

    const invitations = await WorkspaceInvitation.find({
      workspace: workspaceId,
      status: "pending",
    }).populate("invitedBy", "name email avatar");

    res.json({
      success: true,
      message: "Invitations fetched successfully",
      data: invitations,
    });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ error: "Failed to fetch invitations" });
  }
};

/**
 * Accept or decline invitation
 */
export const respondToInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.auth._id;

    // Validation
    if (!action) {
      return res.status(400).json({ error: "Action is required (accept or decline)" });
    }

    // Find invitation
    const invitation = await WorkspaceInvitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ 
        error: `Invitation already ${invitation.status}`,
        status: invitation.status 
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Verify user email matches invitation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.email !== invitation.email) {
      return res.status(403).json({ 
        error: "This invitation is not for you",
        invitedEmail: invitation.email,
        yourEmail: user.email
      });
    }

    // Verify workspace exists
    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    if (action === "accept") {
      // Check if user is already a member
      const existingMember = await WorkspaceMember.findOne({
        workspace: invitation.workspace,
        user: userId,
      });

      if (existingMember) {
        if (existingMember.status === "active") {
          // Update invitation status but don't create duplicate member
          invitation.status = "accepted";
          invitation.acceptedBy = userId;
          invitation.acceptedAt = new Date();
          await invitation.save();

          return res.json({
            success: true,
            message: "You are already a member of this workspace",
            data: { 
              workspaceId: invitation.workspace,
              workspace: {
                _id: workspace._id,
                name: workspace.name,
                slug: workspace.slug
              }
            },
          });
        } else if (existingMember.status === "removed") {
          // Reactivate removed member
          existingMember.status = "active";
          existingMember.role = invitation.role;
          existingMember.joinedAt = new Date();
          existingMember.invitedBy = invitation.invitedBy;
          await existingMember.save();

          invitation.status = "accepted";
          invitation.acceptedBy = userId;
          invitation.acceptedAt = new Date();
          await invitation.save();

          return res.json({
            success: true,
            message: "Invitation accepted successfully. Your membership has been reactivated.",
            data: { 
              workspaceId: invitation.workspace,
              workspace: {
                _id: workspace._id,
                name: workspace.name,
                slug: workspace.slug
              },
              member: existingMember
            },
          });
        }
      }

      // Create new workspace member
      const member = new WorkspaceMember({
        workspace: invitation.workspace,
        user: userId,
        role: invitation.role,
        invitedBy: invitation.invitedBy,
        status: "active",
        joinedAt: new Date(),
      });

      await member.save();

      // Verify member was created
      const verifyMember = await WorkspaceMember.findById(member._id);
      if (!verifyMember) {
        throw new Error("Failed to create workspace member");
      }

      // Update invitation status
      invitation.status = "accepted";
      invitation.acceptedBy = userId;
      invitation.acceptedAt = new Date();
      await invitation.save();

      // Populate member data for response
      await member.populate("user", "name email avatar");

      res.json({
        success: true,
        message: "Invitation accepted successfully",
        data: { 
          workspaceId: invitation.workspace,
          workspace: {
            _id: workspace._id,
            name: workspace.name,
            slug: workspace.slug
          },
          member: {
            _id: member._id,
            role: member.role,
            joinedAt: member.joinedAt,
            user: member.user
          }
        },
      });
    } else if (action === "decline") {
      invitation.status = "declined";
      invitation.declinedBy = userId;
      invitation.declinedAt = new Date();
      await invitation.save();

      res.json({
        success: true,
        message: "Invitation declined",
        data: {
          workspace: {
            _id: workspace._id,
            name: workspace.name
          }
        }
      });
    } else {
      return res.status(400).json({ 
        error: "Invalid action. Use 'accept' or 'decline'",
        providedAction: action
      });
    }
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ 
      error: "Failed to process invitation",
      details: error.message 
    });
  }
};

/**
 * Get user's last selected items
 */
export const getLastSelected = async (req, res) => {
  try {
    const userId = req.auth._id;
    const lastSelected = await getLastSelectedItems(userId);

    res.json({
      success: true,
      message: "Last selected items fetched successfully",
      data: lastSelected,
    });
  } catch (error) {
    console.error("Error fetching last selected items:", error);
    res.status(500).json({ error: "Failed to fetch last selected items" });
  }
};

/**
 * Get invitation details by token (public endpoint)
 */
export const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // Find invitation
    const invitation = await WorkspaceInvitation.findOne({ token })
      .populate("workspace", "name description slug")
      .populate("invitedBy", "name email");

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ 
        error: `Invitation already ${invitation.status}`,
        status: invitation.status 
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ error: "Invitation has expired" });
    }

    res.json({
      success: true,
      data: {
        invitation: {
          _id: invitation._id,
          email: invitation.email,
          role: invitation.role,
          message: invitation.message,
          expiresAt: invitation.expiresAt,
          workspace: invitation.workspace,
          invitedBy: invitation.invitedBy
        }
      }
    });
  } catch (error) {
    console.error("Error fetching invitation details:", error);
    res.status(500).json({ error: "Failed to fetch invitation details" });
  }
};

/**
 * Accept invitation by token (public endpoint)
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.auth._id;

    // Find invitation
    const invitation = await WorkspaceInvitation.findOne({ token });

    if (!invitation) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ 
        error: `Invitation already ${invitation.status}`,
        status: invitation.status 
      });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = "expired";
      await invitation.save();
      return res.status(400).json({ error: "Invitation has expired" });
    }

    // Verify user email matches invitation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.email !== invitation.email) {
      return res.status(403).json({ 
        error: "This invitation is not for you",
        invitedEmail: invitation.email,
        yourEmail: user.email
      });
    }

    // Verify workspace exists
    const workspace = await Workspace.findById(invitation.workspace);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if user is already a member
    const existingMember = await WorkspaceMember.findOne({
      workspace: invitation.workspace,
      user: userId,
    });

    if (existingMember) {
      if (existingMember.status === "active") {
        // Update invitation status but don't create duplicate member
        invitation.status = "accepted";
        invitation.acceptedBy = userId;
        invitation.acceptedAt = new Date();
        await invitation.save();

        return res.json({
          success: true,
          message: "You are already a member of this workspace",
          data: { 
            workspaceId: invitation.workspace,
            workspace: {
              _id: workspace._id,
              name: workspace.name,
              slug: workspace.slug
            }
          },
        });
      } else if (existingMember.status === "removed") {
        // Reactivate removed member
        existingMember.status = "active";
        existingMember.role = invitation.role;
        existingMember.joinedAt = new Date();
        existingMember.invitedBy = invitation.invitedBy;
        await existingMember.save();

        invitation.status = "accepted";
        invitation.acceptedBy = userId;
        invitation.acceptedAt = new Date();
        await invitation.save();

        return res.json({
          success: true,
          message: "Invitation accepted successfully. Your membership has been reactivated.",
          data: { 
            workspaceId: invitation.workspace,
            workspace: {
              _id: workspace._id,
              name: workspace.name,
              slug: workspace.slug
            },
            member: existingMember
          },
        });
      }
    }

    // Create new workspace member
    const member = new WorkspaceMember({
      workspace: invitation.workspace,
      user: userId,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      status: "active",
      joinedAt: new Date(),
    });

    await member.save();

    // Update invitation status
    invitation.status = "accepted";
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Update user's last selected workspace
    await updateLastSelectedWorkspace(userId, {
      id: workspace._id,
      name: workspace.name,
    });

    // Send email notification to workspace owner
    console.log(`\n📧 Sending invitation acceptance notification to workspace owner`);
    try {
      const owner = await User.findById(workspace.owner);
      if (owner) {
        await sendInvitationAcceptedEmail({
          workspace,
          owner,
          newMember: user,
          role: invitation.role,
        });
        console.log(`✅ Invitation acceptance email sent to owner: ${owner.email}`);
      }
    } catch (emailError) {
      console.error(`⚠️ Failed to send invitation acceptance email:`, emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: "Invitation accepted successfully",
      data: { 
        workspaceId: invitation.workspace,
        workspace: {
          _id: workspace._id,
          name: workspace.name,
          slug: workspace.slug
        },
        member: {
          _id: member._id,
          role: member.role,
          joinedAt: member.joinedAt
        }
      },
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({ error: "Failed to accept invitation" });
  }
};

/**
 * Get all tasks across all projects in a workspace
 */
export const getWorkspaceTasks = async (req, res) => {
  try {
    const userId = req.auth._id;

    // Only projects this user can open (requireWorkspaceMember attached the scope)
    const projects = await getAccessibleProjects(
      {
        workspace: req.workspace,
        workspaceMember: req.workspaceMember,
        isWorkspaceOwner: req.isWorkspaceOwner,
        userId,
      },
      "_id"
    );

    const query = {
      project: { $in: projects.map((p) => p._id) },
      isArchived: false,
    };
    if (req.query.assignedToMe === "true") {
      query._id = {
        $in: await TaskAssignment.find({ user: userId, status: "active" }).distinct("task"),
      };
    }

    const tasks = await Task.find(query)
      .populate("project", "name key color")
      .populate("createdBy", "name email")
      .populate("column", "name color")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: await withTaskExtras(tasks),
    });
  } catch (error) {
    console.error("Error fetching workspace tasks:", error);
    res.status(500).json({ error: "Failed to fetch workspace tasks" });
  }
};

/**
 * Get comprehensive workspace activity feed
 * GET /api/workspaces/:workspaceId/activity
 */
export const getWorkspaceActivity = async (req, res) => {
  try {
    const { limit = 30, before, type, userId: actorId, projectId } = req.query;
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);

    const projects = await getAccessibleProjects(
      {
        workspace: req.workspace,
        workspaceMember: req.workspaceMember,
        isWorkspaceOwner: req.isWorkspaceOwner,
        userId: req.auth._id,
      },
      "_id"
    );
    const allowed = projects.map((p) => String(p._id));
    if (projectId && !allowed.includes(String(projectId))) {
      return res.status(403).json({ error: "Access denied" });
    }
    const scope = projectId ? [projectId] : allowed;

    const query = {
      workspace: req.workspace._id,
      $or: [{ project: { $in: scope } }, ...(projectId ? [] : [{ project: { $exists: false } }, { project: null }])],
    };
    if (type) query.targetType = type;
    if (actorId) query.actor = actorId;
    if (before) query.createdAt = { $lt: new Date(before) };

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize + 1)
      .populate("actor", "name email avatar")
      .populate("project", "name key color")
      .lean();

    const hasMore = logs.length > pageSize;
    const data = logs.slice(0, pageSize);

    res.json({
      success: true,
      data,
      nextCursor: hasMore ? data[data.length - 1].createdAt : null,
    });
  } catch (error) {
    console.error("Error fetching workspace activity:", error);
    res.status(500).json({ error: "Failed to fetch workspace activity" });
  }
};

/**
 * Get user overview data for workspace
 * GET /api/workspaces/:workspaceId/overview
 */
export const getWorkspaceOverview = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.auth._id;

    console.log(`\n📊 Fetching workspace overview for user: ${userId}`);

    // Get workspace first
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }

    // Check if user is owner or member
    const isOwner = workspace.owner.toString() === userId.toString();
    const member = await WorkspaceMember.findOne({
      workspace: workspaceId,
      user: userId,
      status: "active",
    });

    if (!isOwner && !member) {
      return res.status(403).json({ error: "Access denied" });
    }

    const overview = {
      tasks: {
        assigned: [],
        overdue: [],
        dueSoon: [],
        completed: []
      },
      notifications: {
        unread: [],
        read: []
      },
      activities: [],
      stats: {
        totalTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
        unreadNotifications: 0,
        recentActivities: 0
      }
    };

    // 1. Get user's assigned tasks
    try {
      const Task = (await import('../models/task.js')).default;
      const TaskAssignment = (await import('../models/taskAssignment.js')).default;
      
      // Get task assignments for user
      const assignments = await TaskAssignment.find({ 
        user: userId,
        role: 'assignee'
      }).populate('task');

      const taskIds = assignments.map(a => a.task._id);
      
      if (taskIds.length > 0) {
        const tasks = await Task.find({ 
          _id: { $in: taskIds },
          workspace: workspaceId
        })
          .populate('project', 'name key')
          .populate('createdBy', 'name email avatar')
          .sort({ createdAt: -1 });

        // Categorize tasks
        const now = new Date();
        const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        tasks.forEach(task => {
          if (task.status === 'completed' || task.status === 'done') {
            overview.tasks.completed.push(task);
          } else {
            overview.tasks.assigned.push(task);
            
            // Check if overdue
            if (task.dueDate && new Date(task.dueDate) < now) {
              overview.tasks.overdue.push(task);
            }
            // Check if due soon (within 2 days)
            else if (task.dueDate && new Date(task.dueDate) <= twoDaysFromNow) {
              overview.tasks.dueSoon.push(task);
            }
          }
        });

        overview.stats.totalTasks = tasks.length;
        overview.stats.completedTasks = overview.tasks.completed.length;
        overview.stats.overdueTasks = overview.tasks.overdue.length;
      }
    } catch (error) {
      console.log('Tasks not available:', error.message);
    }

    // 2. Get user notifications
    try {
      const Notification = (await import('../models/notification.js')).default;
      
      const notifications = await Notification.find({ 
        recipient: userId,
        workspace: workspaceId
      })
        .populate('sender', 'name email avatar')
        .sort({ createdAt: -1 })
        .limit(50);

      overview.notifications.unread = notifications.filter(n => !n.isRead);
      overview.notifications.read = notifications.filter(n => n.isRead);
      overview.stats.unreadNotifications = overview.notifications.unread.length;
    } catch (error) {
      console.log('Notifications not available:', error.message);
    }

    // 3. Get recent activities
    try {
      const ActivityLog = (await import('../models/activityLog.js')).default;
      
      const activities = await ActivityLog.find({ 
        workspace: workspaceId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      })
        .populate('actor', 'name email avatar')
        .populate('target', 'title name')
        .sort({ createdAt: -1 })
        .limit(20);

      overview.activities = activities.map(activity => ({
        _id: activity._id,
        type: 'activity',
        action: activity.action,
        targetType: activity.targetType,
        description: `${activity.action} ${activity.targetType.toLowerCase()}`,
        user: {
          _id: activity.actor._id,
          name: activity.actor.name,
          avatar: activity.actor.avatar
        },
        target: activity.target,
        timestamp: activity.createdAt,
        metadata: {
          changes: activity.changes,
          targetName: activity.targetName
        }
      }));

      overview.stats.recentActivities = activities.length;
    } catch (error) {
      console.log('Activities not available:', error.message);
    }

    console.log(`✅ Overview data fetched successfully`);

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error("Error fetching workspace overview:", error);
    res.status(500).json({ error: "Failed to fetch workspace overview" });
  }
};

export default {
  createWorkspace,
  getUserWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
  inviteToWorkspace,
  getWorkspaceInvitations,
  respondToInvitation,
  getLastSelected,
  getWorkspaceTasks,
  getWorkspaceActivity,
};


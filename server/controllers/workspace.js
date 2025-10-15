import Workspace from "../models/workspace.js";
import WorkspaceMember from "../models/workspaceMember.js";
import WorkspaceInvitation from "../models/workspaceInvitation.js";
import User from "../models/user.js";
import { nanoid } from "nanoid";
import { sendSimpleEmail } from "../utils/mailService.js";
import { updateLastSelectedWorkspace, getLastSelectedItems } from "../utils/lastSelected.js";

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

    // Add owner to the list
    const owner = await User.findById(workspace.owner).select("name email avatar title department");
    
    const allMembers = [
      {
        user: owner,
        role: "owner",
        joinedAt: workspace.createdAt,
        status: "active",
      },
      ...members.map(m => ({
        _id: m._id,
        user: m.user,
        role: m.role,
        joinedAt: m.joinedAt,
        status: m.status,
        customPermissions: m.customPermissions,
      })),
    ];

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

    // Send invitation email
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/invite/${token}`;
    const inviter = await User.findById(invitedBy);

    await sendSimpleEmail({
      to: email,
      subject: `Invitation to join ${workspace.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Workspace Invitation</h2>
          <p>${inviter.name} has invited you to join <strong>${workspace.name}</strong></p>
          ${message ? `<p><em>${message}</em></p>` : ''}
          <p>You will be joining as: <strong>${role}</strong></p>
          <p style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </p>
          <p style="color: #999; font-size: 12px;">This invitation expires in 14 days.</p>
          <p style="color: #666; font-size: 11px; margin-top: 20px;">
            If the button doesn't work, copy and paste this link into your browser:<br/>
            <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
      data: { email, role, token },
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
};


const { logger } = require('@librechat/data-schemas');
const {
  createTeam,
  updateTeam,
  deleteTeam,
  getUserTeam,
  addTeamAdmin,
  removeTeamAdmin,
  removeFromTeam,
  createTeamInvitation,
  acceptTeamInvitation,
  declineTeamInvitation,
  cancelTeamInvitation,
  getPendingInvitations,
  getTeamInvitations,
  findGroupById,
} = require('~/models');

/**
 * Get the current user's team
 */
const getMyTeam = async (req, res) => {
  try {
    const team = await getUserTeam(req.user.id);
    res.status(200).json(team);
  } catch (error) {
    logger.error('[getMyTeam]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create a new team
 */
const createTeamHandler = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const team = await createTeam({
      name: name.trim(),
      description: description?.trim(),
      createdBy: req.user.id,
    });

    res.status(201).json(team);
  } catch (error) {
    logger.error('[createTeam]', error);
    if (error.message === 'User already belongs to a team') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get team details (requires membership)
 */
const getTeamDetails = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await findGroupById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.status(200).json(team);
  } catch (error) {
    logger.error('[getTeamDetails]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update team details (requires admin)
 */
const updateTeamHandler = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description, avatar } = req.body;

    const updated = await updateTeam(teamId, req.user.id, {
      ...(name != null && { name: name.trim() }),
      ...(description != null && { description: description.trim() }),
      ...(avatar != null && { avatar }),
    });

    res.status(200).json(updated);
  } catch (error) {
    logger.error('[updateTeam]', error);
    if (error.message === 'Team not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a team (requires admin)
 */
const deleteTeamHandler = async (req, res) => {
  try {
    const { teamId } = req.params;
    await deleteTeam(teamId, req.user.id);
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    logger.error('[deleteTeam]', error);
    if (error.message === 'Team not found') {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Remove a member from the team (requires admin)
 */
const removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const { newAdminId } = req.body;

    const updated = await removeFromTeam(teamId, req.user.id, userId, newAdminId);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[removeMember]', error);
    if (error.message.includes('not found') || error.message.includes('not a member')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Promote a member to admin (requires admin)
 */
const promoteAdmin = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const updated = await addTeamAdmin(teamId, req.user.id, userId);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[promoteAdmin]', error);
    if (error.message.includes('not found') || error.message.includes('not a member')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Demote an admin (requires admin, cannot remove last admin)
 */
const demoteAdmin = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const updated = await removeTeamAdmin(teamId, req.user.id, userId);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[demoteAdmin]', error);
    if (error.message.includes('last admin')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// Invitation handlers
// ==========================================

/**
 * Send an invitation to join a team (requires admin)
 */
const sendInvitation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const invitation = await createTeamInvitation(teamId, req.user.id, userId);
    res.status(201).json(invitation);
  } catch (error) {
    logger.error('[sendInvitation]', error);
    if (error.message.includes('already a member') || error.message.includes('pending invitation')) {
      return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Cancel a pending invitation (requires admin)
 */
const cancelInvitationHandler = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updated = await cancelTeamInvitation(invitationId, req.user.id);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[cancelInvitation]', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('admin')) {
      return res.status(403).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get invitations for a team (requires admin)
 */
const getTeamInvitationsHandler = async (req, res) => {
  try {
    const { teamId } = req.params;
    const invitations = await getTeamInvitations(teamId);
    res.status(200).json(invitations);
  } catch (error) {
    logger.error('[getTeamInvitations]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get the current user's pending invitations
 */
const getMyInvitations = async (req, res) => {
  try {
    const invitations = await getPendingInvitations(req.user.id);
    res.status(200).json(invitations);
  } catch (error) {
    logger.error('[getMyInvitations]', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Accept an invitation
 */
const acceptInvitationHandler = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updated = await acceptTeamInvitation(invitationId, req.user.id);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[acceptInvitation]', error);
    if (error.message.includes('not for you')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('expired')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already been')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Decline an invitation
 */
const declineInvitationHandler = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const updated = await declineTeamInvitation(invitationId, req.user.id);
    res.status(200).json(updated);
  } catch (error) {
    logger.error('[declineInvitation]', error);
    if (error.message.includes('not for you')) {
      return res.status(403).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    if (error.message.includes('already been')) {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMyTeam,
  createTeamHandler,
  getTeamDetails,
  updateTeamHandler,
  deleteTeamHandler,
  removeMember,
  promoteAdmin,
  demoteAdmin,
  sendInvitation,
  cancelInvitationHandler,
  getTeamInvitationsHandler,
  getMyInvitations,
  acceptInvitationHandler,
  declineInvitationHandler,
};

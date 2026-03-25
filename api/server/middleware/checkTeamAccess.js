const { isTeamAdmin } = require('~/models');

/**
 * Middleware: requires the current user to be a member of the team specified by :teamId
 */
const requireTeamMember = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userTeamId = req.user.teamId?.toString();
    if (!userTeamId || userTeamId !== teamId) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: requires the current user to be an admin of the team specified by :teamId
 */
const requireTeamAdmin = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isAdmin = await isTeamAdmin(teamId, userId);
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only team admins can perform this action' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware: requires the current user to be the invitee of the invitation
 */
const requireInvitee = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // The controller will validate that the invitation belongs to this user
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { requireTeamMember, requireTeamAdmin, requireInvitee };

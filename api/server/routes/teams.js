const express = require('express');
const { requireJwtAuth } = require('~/server/middleware');
const { requireTeamMember, requireTeamAdmin } = require('~/server/middleware/checkTeamAccess');
const controller = require('~/server/controllers/TeamController');

const router = express.Router();

router.use(requireJwtAuth);

// ==========================================
// Static routes (must come before /:teamId)
// ==========================================

/** Get the current user's team */
router.get('/my', controller.getMyTeam);

/** Create a new team */
router.post('/', controller.createTeamHandler);

/** Get the current user's pending invitations */
router.get('/invitations/my', controller.getMyInvitations);

/** Accept an invitation */
router.post('/invitations/:invitationId/accept', controller.acceptInvitationHandler);

/** Decline an invitation */
router.post('/invitations/:invitationId/decline', controller.declineInvitationHandler);

// ==========================================
// Team CRUD (parameterized routes)
// ==========================================

/** Get team details (requires membership) */
router.get('/:teamId', requireTeamMember, controller.getTeamDetails);

/** Update team (requires admin) */
router.patch('/:teamId', requireTeamAdmin, controller.updateTeamHandler);

/** Delete team (requires admin) */
router.delete('/:teamId', requireTeamAdmin, controller.deleteTeamHandler);

// ==========================================
// Member management
// ==========================================

/** Remove a member (requires admin) */
router.delete('/:teamId/members/:userId', requireTeamAdmin, controller.removeMember);

/** Promote a member to admin (requires admin) */
router.post('/:teamId/admins', requireTeamAdmin, controller.promoteAdmin);

/** Demote an admin (requires admin) */
router.delete('/:teamId/admins/:userId', requireTeamAdmin, controller.demoteAdmin);

// ==========================================
// Team-scoped invitations
// ==========================================

/** Send an invitation (requires admin) */
router.post('/:teamId/invitations', requireTeamAdmin, controller.sendInvitation);

/** Cancel an invitation (requires admin) */
router.delete('/:teamId/invitations/:invitationId', requireTeamAdmin, controller.cancelInvitationHandler);

/** List team invitations (requires admin) */
router.get('/:teamId/invitations', requireTeamAdmin, controller.getTeamInvitationsHandler);

module.exports = router;

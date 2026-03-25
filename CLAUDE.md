AGENTS.md

## Teams Architecture

Teams are built on top of the existing `Group` model (not a separate model). A team is a Group with `source: 'local'` plus ownership/billing fields.

### Key design decisions
- **One team per user** — enforced via `teamId` field on User model
- **Teams are optional** — users can exist without a team
- **Any user can create a team** — creator becomes admin + billing owner
- **Billing**: flat rate Ksh. 699/member/month, admin pays for all members
- **Invitation-based joining** — accepting an invite auto-leaves old team
- **Admin succession** — teams must always have at least one admin; auto-promotes longest-standing member if last admin is removed

### Data model
- `Group` schema extended with: `createdBy`, `admins[]`, `billingOwnerId`, `plan`, `memberCount`
- `User` schema extended with: `teamId` (ObjectId ref to Group)
- `TeamInvitation` schema: `teamId`, `invitedBy`, `invitedUserId`, `status`, `expiresAt` (7-day TTL)
- Permission: `SHARE_TEAM` in `Permissions` enum

### Agent sharing with teams
- "Share with Team" creates a `PrincipalType.GROUP` ACL entry for the user's team
- Individual sharing with non-team members still works via existing people picker
- Auto-unshare: when a member is removed or deleted, their team-shared agents are unshared

### Key files
- Schema: `packages/data-schemas/src/schema/group.ts`, `teamInvitation.ts`
- Methods: `packages/data-schemas/src/methods/userGroup.ts` (all team + invitation methods)
- API: `api/server/routes/teams.js`, `api/server/controllers/TeamController.js`
- Middleware: `api/server/middleware/checkTeamAccess.js`
- Service: `api/server/services/PermissionService.js` (shareWithTeam, unshareWithTeam)
- Client hooks: `client/src/data-provider/Teams/`
- UI: `client/src/components/Teams/`, `client/src/components/Sharing/TeamSharingToggle.tsx`
- Settings tab: `client/src/components/Nav/SettingsTabs/Team.tsx`
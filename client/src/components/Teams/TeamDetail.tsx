import { useState } from 'react';
import { Users, Crown, UserMinus, ShieldPlus, ShieldMinus, Trash2 } from 'lucide-react';
import type { TTeam } from 'librechat-data-provider';
import {
  useRemoveTeamMember,
  usePromoteTeamAdmin,
  useDemoteTeamAdmin,
  useDeleteTeam,
} from '~/data-provider';
import InviteMemberDialog from './InviteMemberDialog';
import { useLocalize } from '~/hooks';

interface TeamDetailProps {
  team: TTeam;
  currentUserId: string;
}

export default function TeamDetail({ team, currentUserId }: TeamDetailProps) {
  const localize = useLocalize();
  const [inviteOpen, setInviteOpen] = useState(false);
  const removeMember = useRemoveTeamMember();
  const promoteAdmin = usePromoteTeamAdmin();
  const demoteAdmin = useDemoteTeamAdmin();
  const deleteTeam = useDeleteTeam();

  const isAdmin = team.admins?.includes(currentUserId) ?? false;
  const members = team.memberIds ?? [];

  const handleRemoveMember = (userId: string) => {
    if (!confirm(localize('com_ui_confirm_remove_member'))) {
      return;
    }
    removeMember.mutate({ teamId: team._id, userId });
  };

  const handlePromoteAdmin = (userId: string) => {
    promoteAdmin.mutate({ teamId: team._id, data: { userId } });
  };

  const handleDemoteAdmin = (userId: string) => {
    demoteAdmin.mutate({ teamId: team._id, userId });
  };

  const handleDeleteTeam = () => {
    if (!confirm(localize('com_ui_confirm_delete_team'))) {
      return;
    }
    deleteTeam.mutate(team._id);
  };

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <Users className="size-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">{team.name}</h2>
            {team.description && (
              <p className="text-sm text-text-secondary">{team.description}</p>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={handleDeleteTeam}
            className="rounded-md p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
            title={localize('com_ui_delete_team')}
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      {/* Member count */}
      <p className="text-sm text-text-secondary">
        {localize('com_ui_members_count', { count: team.memberCount ?? members.length })}
      </p>

      {/* Members list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-secondary">
            {localize('com_ui_members')}
          </h3>
          {isAdmin && (
            <button
              onClick={() => setInviteOpen(true)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs text-white hover:bg-green-700"
            >
              {localize('com_ui_invite_member')}
            </button>
          )}
        </div>

        {members.map((memberId) => {
          const memberIsAdmin = team.admins?.includes(memberId) ?? false;
          const isSelf = memberId === currentUserId;

          return (
            <div
              key={memberId}
              className="flex items-center justify-between rounded-lg border border-border-light p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-primary">{memberId}</span>
                {memberIsAdmin && (
                  <Crown className="size-4 text-yellow-500" aria-label={localize('com_ui_admin')} />
                )}
                {isSelf && (
                  <span className="text-xs text-text-secondary">({localize('com_ui_you')})</span>
                )}
              </div>
              {isAdmin && !isSelf && (
                <div className="flex gap-1">
                  {memberIsAdmin ? (
                    <button
                      onClick={() => handleDemoteAdmin(memberId)}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary"
                      title={localize('com_ui_demote_admin')}
                    >
                      <ShieldMinus className="size-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePromoteAdmin(memberId)}
                      className="rounded-md p-1.5 text-text-secondary hover:bg-surface-secondary"
                      title={localize('com_ui_promote_admin')}
                    >
                      <ShieldPlus className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMember(memberId)}
                    className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                    title={localize('com_ui_remove_member')}
                  >
                    <UserMinus className="size-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <InviteMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        teamId={team._id}
      />
    </div>
  );
}

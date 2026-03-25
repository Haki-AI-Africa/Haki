import { Check, X } from 'lucide-react';
import type { TTeamInvitation, TTeam } from 'librechat-data-provider';
import { useGetMyInvitations, useAcceptTeamInvitation, useDeclineTeamInvitation } from '~/data-provider';
import { useLocalize } from '~/hooks';

export default function PendingInvitations() {
  const localize = useLocalize();
  const { data: invitations = [] } = useGetMyInvitations();
  const acceptInvitation = useAcceptTeamInvitation();
  const declineInvitation = useDeclineTeamInvitation();

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-text-secondary">
        {localize('com_ui_pending_invitations')}
      </h3>
      {invitations.map((invitation: TTeamInvitation) => {
        const team = invitation.teamId as TTeam;
        return (
          <div
            key={invitation._id}
            className="flex items-center justify-between rounded-lg border border-border-light p-3"
          >
            <div>
              <p className="text-sm font-medium text-text-primary">
                {team?.name || localize('com_ui_team')}
              </p>
              {team?.description && (
                <p className="text-xs text-text-secondary">{team.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => acceptInvitation.mutate(invitation._id)}
                disabled={acceptInvitation.isLoading}
                className="rounded-md bg-green-600 p-1.5 text-white hover:bg-green-700 disabled:opacity-50"
                title={localize('com_ui_accept')}
              >
                <Check className="size-4" />
              </button>
              <button
                onClick={() => declineInvitation.mutate(invitation._id)}
                disabled={declineInvitation.isLoading}
                className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700 disabled:opacity-50"
                title={localize('com_ui_decline')}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

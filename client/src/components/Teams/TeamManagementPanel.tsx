import { useState } from 'react';
import { Users } from 'lucide-react';
import { useGetMyTeam } from '~/data-provider';
import { useAuthContext } from '~/hooks';
import PendingInvitations from './PendingInvitations';
import CreateTeamDialog from './CreateTeamDialog';
import TeamDetail from './TeamDetail';

export default function TeamManagementPanel() {
  const { user } = useAuthContext();
  const { data: team, isLoading } = useGetMyTeam();
  const [createOpen, setCreateOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PendingInvitations />

      {team ? (
        <TeamDetail team={team} currentUserId={user?.id ?? ''} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border-light p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-secondary">
            <Users className="size-6 text-text-secondary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">No Team</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Create a team to collaborate with others and share agents.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            Create a Team
          </button>
        </div>
      )}

      <CreateTeamDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

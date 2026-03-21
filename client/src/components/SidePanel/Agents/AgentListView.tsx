import { Plus } from 'lucide-react';
import { Button, Spinner } from '@librechat/client';
import { useListAgentsQuery } from '~/data-provider';
import { useLocalize, useAgentDefaultPermissionLevel } from '~/hooks';

export default function AgentListView({
  onSelectAgent,
  onCreateAgent,
}: {
  onSelectAgent: (agentId: string) => void;
  onCreateAgent: () => void;
}) {
  const localize = useLocalize();
  const permissionLevel = useAgentDefaultPermissionLevel();
  const { data: agentsData, isLoading } = useListAgentsQuery(
    { requiredPermission: permissionLevel },
    {
      select: (res) => res.data,
    },
  );

  const agents = agentsData ?? [];

  return (
    <div className="h-auto w-full px-4 pt-3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">
          {localize('com_ui_agent')}
        </h3>
        <Button
          variant="submit"
          className="h-9 px-3"
          onClick={onCreateAgent}
        >
          <Plus className="mr-1 h-4 w-4" />
          {localize('com_ui_create')}
        </Button>
      </div>
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="icon-lg" />
        </div>
      )}
      {!isLoading && (
        <div className="flex flex-col gap-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-border-light p-3 text-left transition-colors hover:bg-surface-hover"
              onClick={() => onSelectAgent(agent.id)}
            >
              {agent.avatar?.filepath ? (
                <img
                  src={agent.avatar.filepath}
                  alt={agent.name ?? ''}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-secondary text-sm font-medium text-text-secondary">
                  {(agent.name ?? 'A').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text-primary">
                  {agent.name || agent.id}
                </p>
                {agent.description && (
                  <p className="truncate text-sm text-text-secondary">
                    {agent.description}
                  </p>
                )}
              </div>
            </button>
          ))}
          {agents.length === 0 && (
            <p className="py-8 text-center text-sm text-text-secondary">
              {localize('com_agents_no_access')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Users, Shield } from 'lucide-react';
import { ResourceType } from 'librechat-data-provider';
import { Switch, InfoHoverCard, ESide, Label } from '@librechat/client';
import type { AccessRoleIds } from 'librechat-data-provider';
import AccessRolesPicker from './AccessRolesPicker';
import { useGetMyTeam } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface TeamSharingToggleProps {
  isTeamShared: boolean;
  teamRole?: AccessRoleIds;
  onTeamToggle: (isTeamShared: boolean) => void;
  onTeamRoleChange: (role: AccessRoleIds) => void;
  resourceType?: ResourceType;
  className?: string;
}

export default function TeamSharingToggle({
  isTeamShared,
  teamRole,
  onTeamToggle,
  onTeamRoleChange,
  resourceType = ResourceType.AGENT,
  className,
}: TeamSharingToggleProps) {
  const localize = useLocalize();
  const { data: team } = useGetMyTeam();

  const handleToggle = React.useCallback(
    (checked: boolean) => {
      onTeamToggle(checked);
    },
    [onTeamToggle],
  );

  // Don't show toggle if user has no team
  if (!team) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main toggle section */}
      <div className="group relative rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'transition-colors duration-200',
                isTeamShared ? 'text-green-600 dark:text-green-500' : 'text-text-secondary',
              )}
            >
              <Users className="size-5" />
            </div>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="share-team-toggle"
                className="cursor-pointer text-sm font-medium text-text-primary"
              >
                {localize('com_ui_share_team', { teamName: team.name })}
              </Label>
              <InfoHoverCard
                side={ESide.Top}
                text={localize('com_ui_share_team_description', { teamName: team.name })}
              />
            </div>
          </div>
          <Switch
            id="share-team-toggle"
            checked={isTeamShared}
            onCheckedChange={handleToggle}
            aria-label={localize('com_ui_share_team', { teamName: team.name })}
          />
        </div>
      </div>

      {/* Permission level section with smooth animation */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          isTeamShared ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0',
        )}
        style={{ overflow: isTeamShared ? 'visible' : 'hidden' }}
      >
        <div
          className={cn(
            'rounded-lg transition-all duration-300',
            isTeamShared ? 'bg-surface-secondary/50 translate-y-0' : '-translate-y-2',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'transition-all duration-300',
                  isTeamShared
                    ? 'scale-100 text-green-600 dark:text-green-500'
                    : 'scale-95 text-text-secondary',
                )}
              >
                <Shield className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="team-permission-level" className="text-sm font-medium text-text-primary">
                  {localize('com_ui_team_permission_level')}
                </Label>
              </div>
            </div>
            <div
              className={cn(
                'relative z-50 transition-all duration-300',
                isTeamShared ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
              )}
            >
              <AccessRolesPicker
                id="team-permission-level"
                resourceType={resourceType}
                selectedRoleId={teamRole}
                onRoleChange={onTeamRoleChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

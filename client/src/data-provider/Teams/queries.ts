import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type { TTeam, TTeamInvitation } from 'librechat-data-provider';
import store from '~/store';

export const useGetMyTeam = (
  config?: UseQueryOptions<TTeam | null>,
): QueryObserverResult<TTeam | null> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<TTeam | null>(
    [QueryKeys.myTeam],
    () => dataService.getMyTeam(),
    {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetMyInvitations = (
  config?: UseQueryOptions<TTeamInvitation[]>,
): QueryObserverResult<TTeamInvitation[]> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<TTeamInvitation[]>(
    [QueryKeys.myInvitations],
    () => dataService.getMyInvitations(),
    {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 1000 * 60,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetTeamInvitations = (
  teamId: string,
  config?: UseQueryOptions<TTeamInvitation[]>,
): QueryObserverResult<TTeamInvitation[]> => {
  return useQuery<TTeamInvitation[]>(
    [QueryKeys.teamInvitations, teamId],
    () => dataService.getTeamInvitations(teamId),
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
      ...config,
      enabled: (config?.enabled ?? true) === true && !!teamId,
    },
  );
};

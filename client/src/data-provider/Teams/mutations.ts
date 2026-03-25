import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, MutationKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type {
  TTeam,
  TTeamInvitation,
  TCreateTeamRequest,
  TUpdateTeamRequest,
  TSendInvitationRequest,
  TPromoteAdminRequest,
} from 'librechat-data-provider';

export const useCreateTeam = (): UseMutationResult<TTeam, unknown, TCreateTeamRequest> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.createTeam],
    (data: TCreateTeamRequest) => dataService.createTeam(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const useUpdateTeam = (): UseMutationResult<
  TTeam,
  unknown,
  { teamId: string; data: TUpdateTeamRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.updateTeam],
    ({ teamId, data }: { teamId: string; data: TUpdateTeamRequest }) =>
      dataService.updateTeam(teamId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const useDeleteTeam = (): UseMutationResult<{ message: string }, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.deleteTeam],
    (teamId: string) => dataService.deleteTeam(teamId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const useRemoveTeamMember = (): UseMutationResult<
  TTeam,
  unknown,
  { teamId: string; userId: string; newAdminId?: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.removeTeamMember],
    ({ teamId, userId, newAdminId }: { teamId: string; userId: string; newAdminId?: string }) =>
      dataService.removeTeamMember(teamId, userId, newAdminId ? { newAdminId } : undefined),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const usePromoteTeamAdmin = (): UseMutationResult<
  TTeam,
  unknown,
  { teamId: string; data: TPromoteAdminRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.promoteTeamAdmin],
    ({ teamId, data }: { teamId: string; data: TPromoteAdminRequest }) =>
      dataService.promoteTeamAdmin(teamId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const useDemoteTeamAdmin = (): UseMutationResult<
  TTeam,
  unknown,
  { teamId: string; userId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.demoteTeamAdmin],
    ({ teamId, userId }: { teamId: string; userId: string }) =>
      dataService.demoteTeamAdmin(teamId, userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
      },
    },
  );
};

export const useSendTeamInvitation = (): UseMutationResult<
  TTeamInvitation,
  unknown,
  { teamId: string; data: TSendInvitationRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.sendTeamInvitation],
    ({ teamId, data }: { teamId: string; data: TSendInvitationRequest }) =>
      dataService.sendTeamInvitation(teamId, data),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries([QueryKeys.teamInvitations, variables.teamId]);
      },
    },
  );
};

export const useCancelTeamInvitation = (): UseMutationResult<
  TTeamInvitation,
  unknown,
  { teamId: string; invitationId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.cancelTeamInvitation],
    ({ teamId, invitationId }: { teamId: string; invitationId: string }) =>
      dataService.cancelTeamInvitation(teamId, invitationId),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries([QueryKeys.teamInvitations, variables.teamId]);
      },
    },
  );
};

export const useAcceptTeamInvitation = (): UseMutationResult<
  TTeamInvitation,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.acceptTeamInvitation],
    (invitationId: string) => dataService.acceptTeamInvitation(invitationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myTeam]);
        queryClient.invalidateQueries([QueryKeys.myInvitations]);
      },
    },
  );
};

export const useDeclineTeamInvitation = (): UseMutationResult<
  TTeamInvitation,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.declineTeamInvitation],
    (invitationId: string) => dataService.declineTeamInvitation(invitationId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.myInvitations]);
      },
    },
  );
};

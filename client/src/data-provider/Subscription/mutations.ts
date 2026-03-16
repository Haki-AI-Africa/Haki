import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QueryKeys, MutationKeys, dataService } from 'librechat-data-provider';
import type { UseMutationResult } from '@tanstack/react-query';
import type t from 'librechat-data-provider';

export const useInitializePayment = (): UseMutationResult<
  t.TPaymentInitResponse,
  unknown,
  { plan: 'starter' | 'standard' }
> => {
  return useMutation([MutationKeys.initializePayment], (data: { plan: 'starter' | 'standard' }) =>
    dataService.initializePayment(data),
  );
};

export const useVerifyPayment = (): UseMutationResult<
  t.TPaymentVerifyResponse,
  unknown,
  string
> => {
  const queryClient = useQueryClient();
  return useMutation(
    [MutationKeys.verifyPayment],
    (reference: string) => dataService.verifyPayment(reference),
    {
      onSuccess: () => {
        queryClient.invalidateQueries([QueryKeys.subscription]);
      },
    },
  );
};

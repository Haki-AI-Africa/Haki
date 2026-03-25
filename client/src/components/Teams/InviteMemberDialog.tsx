import React, { useState } from 'react';
import { OGDialog, OGDialogContent, OGDialogHeader, OGDialogTitle, Input, Label } from '@librechat/client';
import { useSendTeamInvitation } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
}

export default function InviteMemberDialog({ open, onOpenChange, teamId }: InviteMemberDialogProps) {
  const localize = useLocalize();
  const [userId, setUserId] = useState('');
  const sendInvitation = useSendTeamInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      return;
    }
    sendInvitation.mutate(
      { teamId, data: { userId: userId.trim() } },
      {
        onSuccess: () => {
          setUserId('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="w-full max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_ui_invite_member')}</OGDialogTitle>
        </OGDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="invite-user-id" className="text-sm font-medium">
              {localize('com_ui_user_id')}
            </Label>
            <Input
              id="invite-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder={localize('com_ui_enter_user_id')}
              className="mt-1"
              required
            />
          </div>
          {sendInvitation.isError && (
            <p className="text-sm text-red-500">
              {(sendInvitation.error as Error)?.message || localize('com_ui_error')}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary"
            >
              {localize('com_ui_cancel')}
            </button>
            <button
              type="submit"
              disabled={!userId.trim() || sendInvitation.isLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {sendInvitation.isLoading ? localize('com_ui_sending') : localize('com_ui_send_invite')}
            </button>
          </div>
        </form>
      </OGDialogContent>
    </OGDialog>
  );
}

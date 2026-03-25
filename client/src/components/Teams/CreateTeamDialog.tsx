import React, { useState } from 'react';
import { OGDialog, OGDialogContent, OGDialogHeader, OGDialogTitle, Input, Label } from '@librechat/client';
import { useCreateTeam } from '~/data-provider';
import { useLocalize } from '~/hooks';

interface CreateTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateTeamDialog({ open, onOpenChange }: CreateTeamDialogProps) {
  const localize = useLocalize();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const createTeam = useCreateTeam();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    createTeam.mutate(
      { name: name.trim(), description: description.trim() || undefined },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <OGDialog open={open} onOpenChange={onOpenChange}>
      <OGDialogContent className="w-full max-w-md">
        <OGDialogHeader>
          <OGDialogTitle>{localize('com_ui_create_team')}</OGDialogTitle>
        </OGDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="team-name" className="text-sm font-medium">
              {localize('com_ui_team_name')}
            </Label>
            <Input
              id="team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={localize('com_ui_team_name_placeholder')}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label htmlFor="team-description" className="text-sm font-medium">
              {localize('com_ui_description')}
            </Label>
            <Input
              id="team-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={localize('com_ui_team_description_placeholder')}
              className="mt-1"
            />
          </div>
          {createTeam.isError && (
            <p className="text-sm text-red-500">
              {(createTeam.error as Error)?.message || localize('com_ui_error')}
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
              disabled={!name.trim() || createTeam.isLoading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {createTeam.isLoading ? localize('com_ui_creating') : localize('com_ui_create')}
            </button>
          </div>
        </form>
      </OGDialogContent>
    </OGDialog>
  );
}

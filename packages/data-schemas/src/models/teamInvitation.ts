import teamInvitationSchema from '~/schema/teamInvitation';
import type { ITeamInvitation } from '~/types';

/**
 * Creates or returns the TeamInvitation model using the provided mongoose instance and schema
 */
export function createTeamInvitationModel(mongoose: typeof import('mongoose')) {
  return (
    mongoose.models.TeamInvitation ||
    mongoose.model<ITeamInvitation>('TeamInvitation', teamInvitationSchema)
  );
}

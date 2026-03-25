import { Schema } from 'mongoose';
import { TeamInvitationStatus } from '~/types';
import type { ITeamInvitation } from '~/types';

const teamInvitationSchema = new Schema<ITeamInvitation>(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    invitedBy: {
      type: String,
      required: true,
    },
    invitedUserId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TeamInvitationStatus),
      default: TeamInvitationStatus.PENDING,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true },
);

teamInvitationSchema.index({ teamId: 1, invitedUserId: 1, status: 1 });

export default teamInvitationSchema;

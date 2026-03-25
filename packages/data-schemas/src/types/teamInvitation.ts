import type { Document, Types } from 'mongoose';

export enum TeamInvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  CANCELLED = 'cancelled',
}

export interface ITeamInvitation extends Document {
  _id: Types.ObjectId;
  /** The team (Group) being invited to */
  teamId: Types.ObjectId;
  /** userId of the admin who sent the invite */
  invitedBy: string;
  /** userId of the user being invited */
  invitedUserId: string;
  /** Invitation status */
  status: TeamInvitationStatus;
  /** When the invitation expires */
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

import { Schema } from 'mongoose';
import type { IGroup } from '~/types';

const groupSchema = new Schema<IGroup>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
      index: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    memberIds: [
      {
        type: String,
        required: false,
      },
    ],
    source: {
      type: String,
      enum: ['local', 'entra'],
      default: 'local',
    },
    /** External ID (e.g., Entra ID) */
    idOnTheSource: {
      type: String,
      sparse: true,
      index: true,
      required: function (this: IGroup) {
        return this.source !== 'local';
      },
    },
    /** userId of team creator (local teams only) */
    createdBy: {
      type: String,
      required: function (this: IGroup) {
        return this.source === 'local' && this.admins != null && this.admins.length > 0;
      },
    },
    /** userIds who can manage the team */
    admins: [
      {
        type: String,
      },
    ],
    /** userId responsible for billing (defaults to createdBy) */
    billingOwnerId: {
      type: String,
    },
    /** Billing plan identifier */
    plan: {
      type: String,
      default: 'standard',
    },
    /** Denormalized member count for billing queries */
    memberCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

groupSchema.index(
  { idOnTheSource: 1, source: 1 },
  {
    unique: true,
    partialFilterExpression: { idOnTheSource: { $exists: true } },
  },
);
groupSchema.index({ memberIds: 1 });
groupSchema.index({ createdBy: 1 }, { sparse: true });

export default groupSchema;

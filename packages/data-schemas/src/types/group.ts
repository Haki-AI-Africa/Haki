import type { Document, Types } from 'mongoose';
import { CursorPaginationParams } from '~/common';

export interface IGroup extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  email?: string;
  avatar?: string;
  /** Array of member IDs (stores idOnTheSource values, not ObjectIds) */
  memberIds?: string[];
  source: 'local' | 'entra';
  /** External ID (e.g., Entra ID) - required for non-local sources */
  idOnTheSource?: string;
  /** userId of team creator (local teams only) */
  createdBy?: string;
  /** userIds who can manage the team */
  admins?: string[];
  /** userId responsible for billing (defaults to createdBy) */
  billingOwnerId?: string;
  /** Billing plan identifier */
  plan?: string;
  /** Denormalized member count for billing queries */
  memberCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  email?: string;
  avatar?: string;
  memberIds?: string[];
  source: 'local' | 'entra';
  idOnTheSource?: string;
  createdBy?: string;
  admins?: string[];
  billingOwnerId?: string;
  plan?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  email?: string;
  avatar?: string;
  memberIds?: string[];
  source?: 'local' | 'entra' | 'ldap';
  idOnTheSource?: string;
  admins?: string[];
  billingOwnerId?: string;
  plan?: string;
}

export interface GroupFilterOptions extends CursorPaginationParams {
  // Includes email, name and description
  search?: string;
  source?: 'local' | 'entra' | 'ldap';
  hasMember?: string;
}

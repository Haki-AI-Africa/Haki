export interface TTeam {
  _id: string;
  name: string;
  description?: string;
  avatar?: string;
  memberIds?: string[];
  source: string;
  createdBy?: string;
  admins?: string[];
  billingOwnerId?: string;
  plan?: string;
  memberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TTeamInvitation {
  _id: string;
  teamId: string | TTeam;
  invitedBy: string;
  invitedUserId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TCreateTeamRequest {
  name: string;
  description?: string;
}

export interface TUpdateTeamRequest {
  name?: string;
  description?: string;
  avatar?: string;
}

export interface TSendInvitationRequest {
  userId: string;
}

export interface TPromoteAdminRequest {
  userId: string;
}

export interface TRemoveMemberRequest {
  newAdminId?: string;
}

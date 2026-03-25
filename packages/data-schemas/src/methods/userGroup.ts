import { Types } from 'mongoose';
import { PrincipalType } from 'librechat-data-provider';
import type { TUser, TPrincipalSearchResult } from 'librechat-data-provider';
import type { Model, ClientSession } from 'mongoose';
import type { IGroup, IRole, IUser, ITeamInvitation } from '~/types';
import { TeamInvitationStatus } from '~/types';

export function createUserGroupMethods(mongoose: typeof import('mongoose')) {
  /**
   * Find a group by its ID
   * @param groupId - The group ID
   * @param projection - Optional projection of fields to return
   * @param session - Optional MongoDB session for transactions
   * @returns The group document or null if not found
   */
  async function findGroupById(
    groupId: string | Types.ObjectId,
    projection: Record<string, unknown> = {},
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const query = Group.findOne({ _id: groupId }, projection);
    if (session) {
      query.session(session);
    }
    return await query.lean();
  }

  /**
   * Find a group by its external ID (e.g., Entra ID)
   * @param idOnTheSource - The external ID
   * @param source - The source ('entra' or 'local')
   * @param projection - Optional projection of fields to return
   * @param session - Optional MongoDB session for transactions
   * @returns The group document or null if not found
   */
  async function findGroupByExternalId(
    idOnTheSource: string,
    source: 'entra' | 'local' = 'entra',
    projection: Record<string, unknown> = {},
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const query = Group.findOne({ idOnTheSource, source }, projection);
    if (session) {
      query.session(session);
    }
    return await query.lean();
  }

  /**
   * Find groups by name pattern (case-insensitive partial match)
   * @param namePattern - The name pattern to search for
   * @param source - Optional source filter ('entra', 'local', or null for all)
   * @param limit - Maximum number of results to return
   * @param session - Optional MongoDB session for transactions
   * @returns Array of matching groups
   */
  async function findGroupsByNamePattern(
    namePattern: string,
    source: 'entra' | 'local' | null = null,
    limit: number = 20,
    session?: ClientSession,
  ): Promise<IGroup[]> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const regex = new RegExp(namePattern, 'i');
    const query: Record<string, unknown> = {
      $or: [{ name: regex }, { email: regex }, { description: regex }],
    };

    if (source) {
      query.source = source;
    }

    const dbQuery = Group.find(query).limit(limit);
    if (session) {
      dbQuery.session(session);
    }
    return await dbQuery.lean();
  }

  /**
   * Find all groups a user is a member of by their ID or idOnTheSource
   * @param userId - The user ID
   * @param session - Optional MongoDB session for transactions
   * @returns Array of groups the user is a member of
   */
  async function findGroupsByMemberId(
    userId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<IGroup[]> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const userQuery = User.findById(userId, 'idOnTheSource');
    if (session) {
      userQuery.session(session);
    }
    const user = (await userQuery.lean()) as { idOnTheSource?: string } | null;

    if (!user) {
      return [];
    }

    const userIdOnTheSource = user.idOnTheSource || userId.toString();

    const query = Group.find({ memberIds: userIdOnTheSource });
    if (session) {
      query.session(session);
    }
    return await query.lean();
  }

  /**
   * Create a new group
   * @param groupData - Group data including name, source, and optional idOnTheSource
   * @param session - Optional MongoDB session for transactions
   * @returns The created group
   */
  async function createGroup(groupData: Partial<IGroup>, session?: ClientSession): Promise<IGroup> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const options = session ? { session } : {};
    return await Group.create([groupData], options).then((groups) => groups[0]);
  }

  /**
   * Update or create a group by external ID
   * @param idOnTheSource - The external ID
   * @param source - The source ('entra' or 'local')
   * @param updateData - Data to update or set if creating
   * @param session - Optional MongoDB session for transactions
   * @returns The updated or created group
   */
  async function upsertGroupByExternalId(
    idOnTheSource: string,
    source: 'entra' | 'local',
    updateData: Partial<IGroup>,
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const options = {
      new: true,
      upsert: true,
      ...(session ? { session } : {}),
    };

    return await Group.findOneAndUpdate({ idOnTheSource, source }, { $set: updateData }, options);
  }

  /**
   * Add a user to a group
   * Only updates Group.memberIds (one-way relationship)
   * Note: memberIds stores idOnTheSource values, not ObjectIds
   *
   * @param userId - The user ID
   * @param groupId - The group ID to add
   * @param session - Optional MongoDB session for transactions
   * @returns The user and updated group documents
   */
  async function addUserToGroup(
    userId: string | Types.ObjectId,
    groupId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<{ user: IUser; group: IGroup | null }> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const options = { new: true, ...(session ? { session } : {}) };

    const user = (await User.findById(userId, 'idOnTheSource', options).lean()) as {
      idOnTheSource?: string;
      _id: Types.ObjectId;
    } | null;
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const userIdOnTheSource = user.idOnTheSource || userId.toString();
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $addToSet: { memberIds: userIdOnTheSource } },
      options,
    ).lean();

    return { user: user as IUser, group: updatedGroup };
  }

  /**
   * Remove a user from a group
   * Only updates Group.memberIds (one-way relationship)
   * Note: memberIds stores idOnTheSource values, not ObjectIds
   *
   * @param userId - The user ID
   * @param groupId - The group ID to remove
   * @param session - Optional MongoDB session for transactions
   * @returns The user and updated group documents
   */
  async function removeUserFromGroup(
    userId: string | Types.ObjectId,
    groupId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<{ user: IUser; group: IGroup | null }> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const options = { new: true, ...(session ? { session } : {}) };

    const user = (await User.findById(userId, 'idOnTheSource', options).lean()) as {
      idOnTheSource?: string;
      _id: Types.ObjectId;
    } | null;
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const userIdOnTheSource = user.idOnTheSource || userId.toString();
    const updatedGroup = await Group.findByIdAndUpdate(
      groupId,
      { $pull: { memberIds: userIdOnTheSource } },
      options,
    ).lean();

    return { user: user as IUser, group: updatedGroup };
  }

  /**
   * Get all groups a user is a member of
   * @param userId - The user ID
   * @param session - Optional MongoDB session for transactions
   * @returns Array of group documents
   */
  async function getUserGroups(
    userId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<IGroup[]> {
    return await findGroupsByMemberId(userId, session);
  }

  /**
   * Get a list of all principal identifiers for a user (user ID + group IDs + public)
   * For use in permission checks
   * @param params - Parameters object
   * @param params.userId - The user ID
   * @param params.role - Optional user role (if not provided, will query from DB)
   * @param session - Optional MongoDB session for transactions
   * @returns Array of principal objects with type and id
   */
  async function getUserPrincipals(
    params: {
      userId: string | Types.ObjectId;
      role?: string | null;
    },
    session?: ClientSession,
  ): Promise<Array<{ principalType: string; principalId?: string | Types.ObjectId }>> {
    const { userId, role } = params;
    /** `userId` must be an `ObjectId` for USER principal since ACL entries store `ObjectId`s */
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const principals: Array<{ principalType: string; principalId?: string | Types.ObjectId }> = [
      { principalType: PrincipalType.USER, principalId: userObjectId },
    ];

    // If role is not provided, query user to get it
    let userRole = role;
    if (userRole === undefined) {
      const User = mongoose.models.User as Model<IUser>;
      const query = User.findById(userId).select('role');
      if (session) {
        query.session(session);
      }
      const user = await query.lean();
      userRole = user?.role;
    }

    // Add role as a principal if user has one
    if (userRole && userRole.trim()) {
      principals.push({ principalType: PrincipalType.ROLE, principalId: userRole });
    }

    const userGroups = await getUserGroups(userId, session);
    if (userGroups && userGroups.length > 0) {
      userGroups.forEach((group) => {
        principals.push({ principalType: PrincipalType.GROUP, principalId: group._id });
      });
    }

    principals.push({ principalType: PrincipalType.PUBLIC });

    return principals;
  }

  /**
   * Sync a user's Entra ID group memberships
   * @param userId - The user ID
   * @param entraGroups - Array of Entra groups with id and name
   * @param session - Optional MongoDB session for transactions
   * @returns The updated user with new group memberships
   */
  async function syncUserEntraGroups(
    userId: string | Types.ObjectId,
    entraGroups: Array<{ id: string; name: string; description?: string; email?: string }>,
    session?: ClientSession,
  ): Promise<{
    user: IUser;
    addedGroups: IGroup[];
    removedGroups: IGroup[];
  }> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const query = User.findById(userId, { idOnTheSource: 1 });
    if (session) {
      query.session(session);
    }
    const user = (await query.lean()) as { idOnTheSource?: string; _id: Types.ObjectId } | null;

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    /** Get user's idOnTheSource for storing in group.memberIds */
    const userIdOnTheSource = user.idOnTheSource || userId.toString();

    const entraIdMap = new Map<string, boolean>();
    const addedGroups: IGroup[] = [];
    const removedGroups: IGroup[] = [];

    for (const entraGroup of entraGroups) {
      entraIdMap.set(entraGroup.id, true);

      let group = await findGroupByExternalId(entraGroup.id, 'entra', {}, session);

      if (!group) {
        group = await createGroup(
          {
            name: entraGroup.name,
            description: entraGroup.description,
            email: entraGroup.email,
            idOnTheSource: entraGroup.id,
            source: 'entra',
            memberIds: [userIdOnTheSource],
          },
          session,
        );

        addedGroups.push(group);
      } else if (!group.memberIds?.includes(userIdOnTheSource)) {
        const { group: updatedGroup } = await addUserToGroup(userId, group._id, session);
        if (updatedGroup) {
          addedGroups.push(updatedGroup);
        }
      }
    }

    const groupsQuery = Group.find(
      { source: 'entra', memberIds: userIdOnTheSource },
      { _id: 1, idOnTheSource: 1 },
    );
    if (session) {
      groupsQuery.session(session);
    }
    const existingGroups = (await groupsQuery.lean()) as Array<{
      _id: Types.ObjectId;
      idOnTheSource?: string;
    }>;

    for (const group of existingGroups) {
      if (group.idOnTheSource && !entraIdMap.has(group.idOnTheSource)) {
        const { group: removedGroup } = await removeUserFromGroup(userId, group._id, session);
        if (removedGroup) {
          removedGroups.push(removedGroup);
        }
      }
    }

    const userQuery = User.findById(userId);
    if (session) {
      userQuery.session(session);
    }
    const updatedUser = await userQuery.lean();

    if (!updatedUser) {
      throw new Error(`User not found after update: ${userId}`);
    }

    return {
      user: updatedUser,
      addedGroups,
      removedGroups,
    };
  }

  /**
   * Calculate relevance score for a search result
   * @param item - The search result item
   * @param searchPattern - The search pattern
   * @returns Relevance score (0-100)
   */
  function calculateRelevanceScore(item: TPrincipalSearchResult, searchPattern: string): number {
    const exactRegex = new RegExp(`^${searchPattern}$`, 'i');
    const startsWithPattern = searchPattern.toLowerCase();

    /** Get searchable text based on type */
    const searchableFields =
      item.type === PrincipalType.USER
        ? [item.name, item.email, item.username].filter(Boolean)
        : [item.name, item.email, item.description].filter(Boolean);

    let maxScore = 0;

    for (const field of searchableFields) {
      if (!field) continue;
      const fieldLower = field.toLowerCase();
      let score = 0;

      /** Exact match gets highest score */
      if (exactRegex.test(field)) {
        score = 100;
      } else if (fieldLower.startsWith(startsWithPattern)) {
        /** Starts with query gets high score */
        score = 80;
      } else if (fieldLower.includes(startsWithPattern)) {
        /** Contains query gets medium score */
        score = 50;
      } else {
        /** Default score for regex match */
        score = 10;
      }

      maxScore = Math.max(maxScore, score);
    }

    return maxScore;
  }

  /**
   * Sort principals by relevance score and type priority
   * @param results - Array of results with _searchScore property
   * @returns Sorted array
   */
  function sortPrincipalsByRelevance<
    T extends { _searchScore?: number; type: string; name?: string; email?: string },
  >(results: T[]): T[] {
    return results.sort((a, b) => {
      if (b._searchScore !== a._searchScore) {
        return (b._searchScore || 0) - (a._searchScore || 0);
      }
      if (a.type !== b.type) {
        return a.type === PrincipalType.USER ? -1 : 1;
      }
      const aName = a.name || a.email || '';
      const bName = b.name || b.email || '';
      return aName.localeCompare(bName);
    });
  }

  /**
   * Transform user object to TPrincipalSearchResult format
   * @param user - User object from database
   * @returns Transformed user result
   */
  function transformUserToTPrincipalSearchResult(user: TUser): TPrincipalSearchResult {
    return {
      id: user.id,
      type: PrincipalType.USER,
      name: user.name || user.email,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      provider: user.provider,
      source: 'local',
      idOnTheSource: (user as TUser & { idOnTheSource?: string }).idOnTheSource || user.id,
    };
  }

  /**
   * Transform group object to TPrincipalSearchResult format
   * @param group - Group object from database
   * @returns Transformed group result
   */
  function transformGroupToTPrincipalSearchResult(group: IGroup): TPrincipalSearchResult {
    return {
      id: group._id?.toString(),
      type: PrincipalType.GROUP,
      name: group.name,
      email: group.email,
      avatar: group.avatar,
      description: group.description,
      source: group.source || 'local',
      memberCount: group.memberIds ? group.memberIds.length : 0,
      idOnTheSource: group.idOnTheSource || group._id?.toString(),
    };
  }

  /**
   * Search for principals (users and groups) by pattern matching on name/email
   * Returns combined results in TPrincipalSearchResult format without sorting
   * @param searchPattern - The pattern to search for
   * @param limitPerType - Maximum number of results to return
   * @param typeFilter - Optional array of types to filter by, or null for all types
   * @param session - Optional MongoDB session for transactions
   * @returns Array of principals in TPrincipalSearchResult format
   */
  async function searchPrincipals(
    searchPattern: string,
    limitPerType: number = 10,
    typeFilter: Array<PrincipalType.USER | PrincipalType.GROUP | PrincipalType.ROLE> | null = null,
    session?: ClientSession,
    teamId?: string | null,
  ): Promise<TPrincipalSearchResult[]> {
    if (!searchPattern || searchPattern.trim().length === 0) {
      return [];
    }

    const trimmedPattern = searchPattern.trim();
    const promises: Promise<TPrincipalSearchResult[]>[] = [];

    if (!typeFilter || typeFilter.includes(PrincipalType.USER)) {
      /** Note: searchUsers is imported from ~/models and needs to be passed in or implemented */
      const userFields = 'name email username avatar provider idOnTheSource';
      /** For now, we'll use a direct query instead of searchUsers */
      const User = mongoose.models.User as Model<IUser>;
      const regex = new RegExp(trimmedPattern, 'i');
      const userFilter: Record<string, unknown> = {
        $or: [{ name: regex }, { email: regex }, { username: regex }],
      };
      // If the requesting user has a team, only show team members in the picker
      if (teamId) {
        userFilter.teamId = new mongoose.Types.ObjectId(teamId);
      }
      const userQuery = User.find(userFilter)
        .select(userFields)
        .limit(limitPerType);

      if (session) {
        userQuery.session(session);
      }

      promises.push(
        userQuery.lean().then((users) =>
          users.map((user) => {
            const userWithId = user as IUser & { idOnTheSource?: string };
            return transformUserToTPrincipalSearchResult({
              id: userWithId._id?.toString() || '',
              name: userWithId.name,
              email: userWithId.email,
              username: userWithId.username,
              avatar: userWithId.avatar,
              provider: userWithId.provider,
            } as TUser);
          }),
        ),
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    if (!typeFilter || typeFilter.includes(PrincipalType.GROUP)) {
      promises.push(
        findGroupsByNamePattern(trimmedPattern, null, limitPerType, session).then((groups) =>
          groups.map(transformGroupToTPrincipalSearchResult),
        ),
      );
    } else {
      promises.push(Promise.resolve([]));
    }

    if (!typeFilter || typeFilter.includes(PrincipalType.ROLE)) {
      const Role = mongoose.models.Role as Model<IRole>;
      if (Role) {
        const regex = new RegExp(trimmedPattern, 'i');
        const roleQuery = Role.find({ name: regex }).select('name').limit(limitPerType);

        if (session) {
          roleQuery.session(session);
        }

        promises.push(
          roleQuery.lean().then((roles) =>
            roles.map((role) => ({
              /** Role name as ID */
              id: role.name,
              type: PrincipalType.ROLE,
              name: role.name,
              source: 'local' as const,
              idOnTheSource: role.name,
            })),
          ),
        );
      }
    } else {
      promises.push(Promise.resolve([]));
    }

    const results = await Promise.all(promises);
    const combined = results.flat();
    return combined;
  }

  // ==========================================
  // Team Methods (local groups with ownership)
  // ==========================================

  /**
   * Create a new team (local group with ownership)
   * @param data - Team data
   * @param session - Optional MongoDB session for transactions
   * @returns The created team and updated user
   */
  async function createTeam(
    data: { name: string; description?: string; createdBy: string },
    session?: ClientSession,
  ): Promise<IGroup> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const userId = data.createdBy;

    // Check if user already has a team
    const user = await User.findById(userId, 'teamId idOnTheSource').session(session ?? null).lean();
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    if ((user as IUser & { teamId?: Types.ObjectId }).teamId) {
      throw new Error('User already belongs to a team');
    }

    const userIdStr = userId.toString();
    const options = session ? { session } : {};

    const [team] = await Group.create(
      [
        {
          name: data.name,
          description: data.description,
          source: 'local',
          createdBy: userIdStr,
          admins: [userIdStr],
          billingOwnerId: userIdStr,
          memberIds: [userIdStr],
          memberCount: 1,
          plan: 'standard',
        },
      ],
      options,
    );

    await User.findByIdAndUpdate(userId, { teamId: team._id }, { session: session ?? null });

    return team;
  }

  /**
   * Update a team's details (requires admin)
   * @param teamId - The team ID
   * @param userId - The requesting user ID (must be admin)
   * @param updateData - Fields to update
   * @param session - Optional MongoDB session
   * @returns The updated team
   */
  async function updateTeam(
    teamId: string | Types.ObjectId,
    userId: string,
    updateData: { name?: string; description?: string; avatar?: string },
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(userId.toString())) {
      throw new Error('Only team admins can update the team');
    }

    return await Group.findByIdAndUpdate(
      teamId,
      { $set: updateData },
      { new: true, session: session ?? null },
    ).lean();
  }

  /**
   * Delete a team and clean up all references
   * @param teamId - The team ID
   * @param userId - The requesting user ID (must be admin)
   * @param session - Optional MongoDB session
   */
  async function deleteTeam(
    teamId: string | Types.ObjectId,
    userId: string,
    session?: ClientSession,
  ): Promise<void> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;
    const AclEntry = mongoose.models.AclEntry;
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(userId.toString())) {
      throw new Error('Only team admins can delete the team');
    }

    // Clear teamId from all members
    await User.updateMany(
      { teamId: new Types.ObjectId(teamId.toString()) },
      { $unset: { teamId: 1 } },
      { session: session ?? null },
    );

    // Remove all ACL entries that reference this team as a GROUP principal
    if (AclEntry) {
      await AclEntry.deleteMany(
        { principalType: PrincipalType.GROUP, principalId: new Types.ObjectId(teamId.toString()) },
        { session: session ?? null },
      );
    }

    // Delete pending invitations
    if (TeamInvitation) {
      await TeamInvitation.deleteMany(
        { teamId: new Types.ObjectId(teamId.toString()) },
        { session: session ?? null },
      );
    }

    // Delete the team
    await Group.findByIdAndDelete(teamId, { session: session ?? null });
  }

  /**
   * Check if a user is a team admin
   * @param teamId - The team ID
   * @param userId - The user ID to check
   * @param session - Optional MongoDB session
   * @returns True if user is an admin of the team
   */
  async function isTeamAdmin(
    teamId: string | Types.ObjectId,
    userId: string,
    session?: ClientSession,
  ): Promise<boolean> {
    const Group = mongoose.models.Group as Model<IGroup>;
    const team = await Group.findById(teamId, 'admins').session(session ?? null).lean();
    if (!team) {
      return false;
    }
    return team.admins?.includes(userId.toString()) ?? false;
  }

  /**
   * Get a user's team (local group they belong to)
   * @param userId - The user ID
   * @param session - Optional MongoDB session
   * @returns The team or null
   */
  async function getUserTeam(
    userId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const user = await User.findById(userId, 'teamId').session(session ?? null).lean();
    if (!user || !(user as IUser & { teamId?: Types.ObjectId }).teamId) {
      return null;
    }

    return await Group.findById(
      (user as IUser & { teamId?: Types.ObjectId }).teamId,
    ).session(session ?? null).lean();
  }

  /**
   * Promote a team member to admin
   * @param teamId - The team ID
   * @param adminUserId - The requesting admin's user ID
   * @param targetUserId - The user to promote
   * @param session - Optional MongoDB session
   */
  async function addTeamAdmin(
    teamId: string | Types.ObjectId,
    adminUserId: string,
    targetUserId: string,
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(adminUserId.toString())) {
      throw new Error('Only team admins can promote members');
    }
    if (!team.memberIds?.includes(targetUserId.toString())) {
      throw new Error('User is not a member of the team');
    }

    return await Group.findByIdAndUpdate(
      teamId,
      { $addToSet: { admins: targetUserId.toString() } },
      { new: true, session: session ?? null },
    ).lean();
  }

  /**
   * Demote a team admin (cannot remove last admin)
   * @param teamId - The team ID
   * @param adminUserId - The requesting admin's user ID
   * @param targetUserId - The admin to demote
   * @param session - Optional MongoDB session
   */
  async function removeTeamAdmin(
    teamId: string | Types.ObjectId,
    adminUserId: string,
    targetUserId: string,
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const Group = mongoose.models.Group as Model<IGroup>;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(adminUserId.toString())) {
      throw new Error('Only team admins can demote admins');
    }
    if (!team.admins?.includes(targetUserId.toString())) {
      throw new Error('User is not an admin');
    }
    if (team.admins.length <= 1) {
      throw new Error('Cannot remove the last admin from the team');
    }

    return await Group.findByIdAndUpdate(
      teamId,
      { $pull: { admins: targetUserId.toString() } },
      { new: true, session: session ?? null },
    ).lean();
  }

  /**
   * Remove a member from a team (admin only).
   * Handles admin succession if removing the last admin.
   * Unshares the member's agents from the team.
   * @param teamId - The team ID
   * @param adminUserId - The requesting admin's user ID
   * @param targetUserId - The member to remove
   * @param newAdminId - Optional: if removing the last admin, promote this user instead
   * @param session - Optional MongoDB session
   */
  async function removeFromTeam(
    teamId: string | Types.ObjectId,
    adminUserId: string,
    targetUserId: string,
    newAdminId?: string,
    session?: ClientSession,
  ): Promise<IGroup | null> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;
    const AclEntry = mongoose.models.AclEntry;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(adminUserId.toString())) {
      throw new Error('Only team admins can remove members');
    }
    if (!team.memberIds?.includes(targetUserId.toString())) {
      throw new Error('User is not a member of the team');
    }

    const targetIsAdmin = team.admins?.includes(targetUserId.toString()) ?? false;

    // Handle admin succession if removing the last admin
    if (targetIsAdmin && team.admins.length <= 1) {
      const remainingMembers = team.memberIds.filter((id) => id !== targetUserId.toString());
      if (remainingMembers.length === 0) {
        // No remaining members — delete the team instead
        await deleteTeam(teamId, adminUserId, session);
        return null;
      }

      const successor = newAdminId && remainingMembers.includes(newAdminId)
        ? newAdminId
        : remainingMembers[0]; // First (longest-standing) member

      await Group.findByIdAndUpdate(
        teamId,
        { $addToSet: { admins: successor } },
        { session: session ?? null },
      );
    }

    // Unshare member's agents from the team (remove GROUP ACL entries they granted)
    if (AclEntry) {
      await AclEntry.deleteMany(
        {
          principalType: PrincipalType.GROUP,
          principalId: new Types.ObjectId(teamId.toString()),
          grantedBy: new Types.ObjectId(targetUserId),
        },
        { session: session ?? null },
      );
    }

    // Remove from memberIds and admins
    const updatedTeam = await Group.findByIdAndUpdate(
      teamId,
      {
        $pull: { memberIds: targetUserId.toString(), admins: targetUserId.toString() },
        $inc: { memberCount: -1 },
      },
      { new: true, session: session ?? null },
    ).lean();

    // Clear user's teamId
    await User.findByIdAndUpdate(targetUserId, { $unset: { teamId: 1 } }, { session: session ?? null });

    return updatedTeam;
  }

  /**
   * Handle user account deletion: unshare agents, remove from team, handle admin succession
   * @param userId - The user being deleted
   * @param session - Optional MongoDB session
   */
  async function handleUserDeletion(
    userId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<void> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;
    const AclEntry = mongoose.models.AclEntry;
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;

    const userIdStr = userId.toString();
    const user = await User.findById(userId, 'teamId').session(session ?? null).lean();
    if (!user) {
      return;
    }

    const teamId = (user as IUser & { teamId?: Types.ObjectId }).teamId;
    if (!teamId) {
      return;
    }

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      return;
    }

    // Unshare user's agents from the team
    if (AclEntry) {
      await AclEntry.deleteMany(
        {
          principalType: PrincipalType.GROUP,
          principalId: teamId,
          grantedBy: new Types.ObjectId(userIdStr),
        },
        { session: session ?? null },
      );
    }

    const wasAdmin = team.admins?.includes(userIdStr) ?? false;

    // Remove from team
    await Group.findByIdAndUpdate(
      teamId,
      {
        $pull: { memberIds: userIdStr, admins: userIdStr },
        $inc: { memberCount: -1 },
      },
      { session: session ?? null },
    );

    // Handle admin succession
    if (wasAdmin) {
      const updatedTeam = await Group.findById(teamId).session(session ?? null).lean();
      if (updatedTeam && (!updatedTeam.admins || updatedTeam.admins.length === 0)) {
        if (updatedTeam.memberIds && updatedTeam.memberIds.length > 0) {
          // Auto-promote the longest-standing member (first in array)
          await Group.findByIdAndUpdate(
            teamId,
            { $addToSet: { admins: updatedTeam.memberIds[0] } },
            { session: session ?? null },
          );
        }
        // If no members left, team is empty — could be cleaned up separately
      }
    }

    // Cancel any pending invitations sent by this user
    if (TeamInvitation) {
      await TeamInvitation.updateMany(
        { invitedBy: userIdStr, status: TeamInvitationStatus.PENDING },
        { $set: { status: TeamInvitationStatus.CANCELLED } },
        { session: session ?? null },
      );
    }
  }

  // ==========================================
  // Team Invitation Methods
  // ==========================================

  /**
   * Create a team invitation
   * @param teamId - The team ID
   * @param invitedBy - The admin userId sending the invite
   * @param invitedUserId - The userId being invited
   * @param session - Optional MongoDB session
   * @returns The created invitation
   */
  async function createTeamInvitation(
    teamId: string | Types.ObjectId,
    invitedBy: string,
    invitedUserId: string,
    session?: ClientSession,
  ): Promise<ITeamInvitation> {
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const team = await Group.findById(teamId).session(session ?? null).lean();
    if (!team) {
      throw new Error('Team not found');
    }
    if (!team.admins?.includes(invitedBy.toString())) {
      throw new Error('Only team admins can send invitations');
    }
    if (team.memberIds?.includes(invitedUserId.toString())) {
      throw new Error('User is already a member of this team');
    }

    // Check for existing pending invitation
    const existing = await TeamInvitation.findOne({
      teamId: new Types.ObjectId(teamId.toString()),
      invitedUserId,
      status: TeamInvitationStatus.PENDING,
    }).session(session ?? null).lean();

    if (existing) {
      throw new Error('User already has a pending invitation to this team');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const options = session ? { session } : {};
    const [invitation] = await TeamInvitation.create(
      [
        {
          teamId: new Types.ObjectId(teamId.toString()),
          invitedBy,
          invitedUserId,
          status: TeamInvitationStatus.PENDING,
          expiresAt,
        },
      ],
      options,
    );

    return invitation;
  }

  /**
   * Accept a team invitation. Removes user from old team if any (including unsharing agents).
   * @param invitationId - The invitation ID
   * @param userId - The user accepting (must match invitedUserId)
   * @param session - Optional MongoDB session
   * @returns The updated invitation
   */
  async function acceptTeamInvitation(
    invitationId: string | Types.ObjectId,
    userId: string,
    session?: ClientSession,
  ): Promise<ITeamInvitation> {
    const User = mongoose.models.User as Model<IUser>;
    const Group = mongoose.models.Group as Model<IGroup>;
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;
    const AclEntry = mongoose.models.AclEntry;

    const invitation = await TeamInvitation.findById(invitationId).session(session ?? null).lean();
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.invitedUserId !== userId.toString()) {
      throw new Error('This invitation is not for you');
    }
    if (invitation.status !== TeamInvitationStatus.PENDING) {
      throw new Error(`Invitation has already been ${invitation.status}`);
    }
    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    const userIdStr = userId.toString();

    // Check if user is currently in a team — if so, leave it first
    const user = await User.findById(userId, 'teamId').session(session ?? null).lean();
    const currentTeamId = (user as IUser & { teamId?: Types.ObjectId })?.teamId;

    if (currentTeamId) {
      const currentTeam = await Group.findById(currentTeamId).session(session ?? null).lean();
      if (currentTeam) {
        // Unshare user's agents from old team
        if (AclEntry) {
          await AclEntry.deleteMany(
            {
              principalType: PrincipalType.GROUP,
              principalId: currentTeamId,
              grantedBy: new Types.ObjectId(userIdStr),
            },
            { session: session ?? null },
          );
        }

        // Handle admin succession in old team
        const wasAdmin = currentTeam.admins?.includes(userIdStr) ?? false;
        await Group.findByIdAndUpdate(
          currentTeamId,
          {
            $pull: { memberIds: userIdStr, admins: userIdStr },
            $inc: { memberCount: -1 },
          },
          { session: session ?? null },
        );

        if (wasAdmin) {
          const updatedOldTeam = await Group.findById(currentTeamId).session(session ?? null).lean();
          if (updatedOldTeam && (!updatedOldTeam.admins || updatedOldTeam.admins.length === 0)) {
            if (updatedOldTeam.memberIds && updatedOldTeam.memberIds.length > 0) {
              await Group.findByIdAndUpdate(
                currentTeamId,
                { $addToSet: { admins: updatedOldTeam.memberIds[0] } },
                { session: session ?? null },
              );
            }
          }
        }
      }
    }

    // Add user to new team
    await Group.findByIdAndUpdate(
      invitation.teamId,
      {
        $addToSet: { memberIds: userIdStr },
        $inc: { memberCount: 1 },
      },
      { session: session ?? null },
    );

    // Set user's teamId
    await User.findByIdAndUpdate(userId, { teamId: invitation.teamId }, { session: session ?? null });

    // Update invitation status
    const updatedInvitation = await TeamInvitation.findByIdAndUpdate(
      invitationId,
      { $set: { status: TeamInvitationStatus.ACCEPTED } },
      { new: true, session: session ?? null },
    ).lean();

    // Cancel any other pending invitations for this user
    await TeamInvitation.updateMany(
      {
        invitedUserId: userIdStr,
        status: TeamInvitationStatus.PENDING,
        _id: { $ne: new Types.ObjectId(invitationId.toString()) },
      },
      { $set: { status: TeamInvitationStatus.CANCELLED } },
      { session: session ?? null },
    );

    return updatedInvitation as ITeamInvitation;
  }

  /**
   * Decline a team invitation
   * @param invitationId - The invitation ID
   * @param userId - The user declining (must match invitedUserId)
   * @param session - Optional MongoDB session
   */
  async function declineTeamInvitation(
    invitationId: string | Types.ObjectId,
    userId: string,
    session?: ClientSession,
  ): Promise<ITeamInvitation> {
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;

    const invitation = await TeamInvitation.findById(invitationId).session(session ?? null).lean();
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.invitedUserId !== userId.toString()) {
      throw new Error('This invitation is not for you');
    }
    if (invitation.status !== TeamInvitationStatus.PENDING) {
      throw new Error(`Invitation has already been ${invitation.status}`);
    }

    const updated = await TeamInvitation.findByIdAndUpdate(
      invitationId,
      { $set: { status: TeamInvitationStatus.DECLINED } },
      { new: true, session: session ?? null },
    ).lean();

    return updated as ITeamInvitation;
  }

  /**
   * Cancel a pending invitation (admin only)
   * @param invitationId - The invitation ID
   * @param adminUserId - The admin cancelling
   * @param session - Optional MongoDB session
   */
  async function cancelTeamInvitation(
    invitationId: string | Types.ObjectId,
    adminUserId: string,
    session?: ClientSession,
  ): Promise<ITeamInvitation> {
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;
    const Group = mongoose.models.Group as Model<IGroup>;

    const invitation = await TeamInvitation.findById(invitationId).session(session ?? null).lean();
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.status !== TeamInvitationStatus.PENDING) {
      throw new Error(`Invitation has already been ${invitation.status}`);
    }

    const team = await Group.findById(invitation.teamId, 'admins').session(session ?? null).lean();
    if (!team || !team.admins?.includes(adminUserId.toString())) {
      throw new Error('Only team admins can cancel invitations');
    }

    const updated = await TeamInvitation.findByIdAndUpdate(
      invitationId,
      { $set: { status: TeamInvitationStatus.CANCELLED } },
      { new: true, session: session ?? null },
    ).lean();

    return updated as ITeamInvitation;
  }

  /**
   * Get pending invitations for a user
   * @param userId - The user ID
   * @param session - Optional MongoDB session
   * @returns Array of pending invitations with team info
   */
  async function getPendingInvitations(
    userId: string,
    session?: ClientSession,
  ): Promise<ITeamInvitation[]> {
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;

    return await TeamInvitation.find({
      invitedUserId: userId,
      status: TeamInvitationStatus.PENDING,
      expiresAt: { $gt: new Date() },
    })
      .populate('teamId', 'name description avatar memberCount')
      .session(session ?? null)
      .lean();
  }

  /**
   * Get all invitations for a team (admin use)
   * @param teamId - The team ID
   * @param session - Optional MongoDB session
   * @returns Array of invitations
   */
  async function getTeamInvitations(
    teamId: string | Types.ObjectId,
    session?: ClientSession,
  ): Promise<ITeamInvitation[]> {
    const TeamInvitation = mongoose.models.TeamInvitation as Model<ITeamInvitation>;

    return await TeamInvitation.find({
      teamId: new Types.ObjectId(teamId.toString()),
      status: TeamInvitationStatus.PENDING,
    })
      .session(session ?? null)
      .lean();
  }

  return {
    findGroupById,
    findGroupByExternalId,
    findGroupsByNamePattern,
    findGroupsByMemberId,
    createGroup,
    upsertGroupByExternalId,
    addUserToGroup,
    removeUserFromGroup,
    getUserGroups,
    getUserPrincipals,
    syncUserEntraGroups,
    searchPrincipals,
    calculateRelevanceScore,
    sortPrincipalsByRelevance,
    // Team methods
    createTeam,
    updateTeam,
    deleteTeam,
    isTeamAdmin,
    getUserTeam,
    addTeamAdmin,
    removeTeamAdmin,
    removeFromTeam,
    handleUserDeletion,
    // Team invitation methods
    createTeamInvitation,
    acceptTeamInvitation,
    declineTeamInvitation,
    cancelTeamInvitation,
    getPendingInvitations,
    getTeamInvitations,
  };
}

export type UserGroupMethods = ReturnType<typeof createUserGroupMethods>;

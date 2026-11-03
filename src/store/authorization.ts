import type { UserRole } from "./types";

const rolePriority: Record<UserRole, number> = {
    user: 0,
    moderator: 1,
    admin: 2,
};

export function hasRole(
    userRole: UserRole | undefined,
    requiredRole: UserRole,
) {
    if (!userRole) return false;

    return rolePriority[userRole] >= rolePriority[requiredRole];
}

export function isModerator(userRole: UserRole | undefined) {
    return hasRole(userRole, "moderator");
}

import { useAuthStore } from "@/src/store/authStore";
import { hasRole, isModerator } from "@/src/store/authorization";
import type { UserRole } from "@/src/store/types";

export function useAuthorization() {
    const userRole = useAuthStore((state) => state.user?.role);

    return {
        role: userRole,
        isModerator: isModerator(userRole),
        hasRole: (requiredRole: UserRole) => hasRole(userRole, requiredRole),
    };
}

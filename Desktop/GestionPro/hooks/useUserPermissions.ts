import { useStore } from '../src/store/useStore';
import { PERMISSIONS } from '../config/permissions';

export const useUserPermissions = () => {
    const currentUser = useStore((state) => state.currentUser);

    const hasPermission = (permissionKey: string): boolean => {
        if (!currentUser) return false;

        // SysAdmin and Admin (Legacy) always have access
        if (currentUser.role === 'sysadmin' || currentUser.role === 'admin') return true;

        // Check granular permissions
        if (currentUser.permissions && currentUser.permissions.includes(permissionKey)) {
            return true;
        }

        return false;
    };

    return {
        currentUser,
        hasPermission,
        canViewCost: hasPermission(PERMISSIONS.CATALOG_VIEW_COST),
        canManageCatalog: hasPermission(PERMISSIONS.CATALOG_MANAGE),
        canCloseCash: hasPermission(PERMISSIONS.POS_CLOSE_CASH),
        canViewReports: hasPermission(PERMISSIONS.REPORTS_VIEW),
        canManageUsers: hasPermission(PERMISSIONS.ADMIN_MANAGE_USERS),
        canApplyDiscount: hasPermission(PERMISSIONS.POS_APPLY_DISCOUNT),
        canManageExpenses: hasPermission(PERMISSIONS.EXPENSES_MANAGE),
        canManageStock: hasPermission(PERMISSIONS.INVENTORY_MANAGE) || hasPermission(PERMISSIONS.STOCK_ENTRY)
    };
};

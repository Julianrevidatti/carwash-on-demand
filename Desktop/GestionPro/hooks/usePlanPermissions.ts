import { useStore } from '../src/store/useStore'; // Assuming store is here or adjust path
import { PLAN_LIMITS, PricingPlan } from '../config/planLimits';

export const usePlanPermissions = () => {
    const currentTenant = useStore((state) => state.currentTenant);
    const products = useStore((state) => state.products);
    const systemUsers = useStore((state) => state.systemUsers);
    const currentUser = useStore((state) => state.currentUser);

    // Default to FREE if no plan defined
    const planKey = (currentTenant?.pricingPlan || 'FREE') as PricingPlan;
    const limits = PLAN_LIMITS[planKey];

    const canAddUser = () => {
        // Check if current user count is less than allowed
        // Note: systemUsers usually includes the owner, so we count strictly
        return systemUsers.length < limits.maxUsers;
    };

    const canAddProduct = () => {
        return products.length < limits.maxProducts;
    };

    const checkPermission = (permission: 'canAccessReports' | 'canAccessOrderPlanner') => {
        return !!limits[permission];
    };

    // Calculate License Status
    const today = new Date();
    // Prioritize Tenant nextDueDate as source of truth for the business
    const rawExpiry = currentTenant?.nextDueDate || currentUser?.subscriptionExpiry;
    const expiryDate = rawExpiry ? new Date(rawExpiry) : new Date();
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // Grace period logic: ONLY for paid plans
    // FREE plans have 0 grace period (immediate block)
    // PAID plans (BASIC/PRO/ULTIMATE) have 5 days grace period
    const isPaidPlan = planKey !== 'FREE';
    const gracePeriodDays = isPaidPlan ? 5 : 0;

    // Calculate grace days elapsed and remaining based strictly on expiration date
    const daysExpired = daysRemaining < 0 ? Math.abs(daysRemaining) : 0;
    const graceDaysRemaining = Math.max(0, gracePeriodDays - daysExpired);

    // User is in grace period if:
    // 1. License expired (daysRemaining <= 0)
    // 2. Has a paid plan
    // 3. Still has grace days remaining
    const isInGracePeriod = daysRemaining <= 0 && graceDaysRemaining > 0 && isPaidPlan;

    // LICENSE LOCKING LOGIC
    // 1. Sysadmin is never locked
    // 2. If tenant status is explicitly 'LOCKED', block access
    // 3. If license expired AND no grace days remaining, block access
    const isLockedByLicense = currentUser?.role === 'sysadmin'
        ? false
        : (currentTenant?.status === 'LOCKED' || (daysRemaining <= 0 && graceDaysRemaining === 0));

    return {
        currentPlan: planKey,
        limits,
        canAddUser,
        canAddProduct,
        canAccessReports: checkPermission('canAccessReports'),
        canAccessOrderPlanner: checkPermission('canAccessOrderPlanner'),
        canAccessPromotions: !!limits.canAccessPromotions,
        remainingProducts: limits.maxProducts - products.length,
        remainingUsers: limits.maxUsers - systemUsers.length,
        daysRemaining,
        isLockedByLicense,
        isInGracePeriod,
        graceDaysRemaining
    };
};

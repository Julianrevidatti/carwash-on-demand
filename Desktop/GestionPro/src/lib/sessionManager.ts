/**
 * Session Manager
 * Handles multi-device session synchronization and token refresh
 */

import { supabase } from './supabase';

export class SessionManager {
    private static instance: SessionManager;
    private refreshInterval: NodeJS.Timeout | null = null;
    private tokenRefreshCallback: (() => Promise<string | null>) | null = null;

    private constructor() { }

    static getInstance(): SessionManager {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }

    /**
     * Initialize session manager with token refresh callback
     * @param getToken - Function to get fresh token from Clerk
     */
    initialize(getToken: () => Promise<string | null>) {
        this.tokenRefreshCallback = getToken;
        this.startTokenRefresh();
        this.setupVisibilityListener();
    }

    /**
     * Start automatic token refresh every 45 minutes
     * Clerk tokens typically expire after 1 hour
     */
    private startTokenRefresh() {
        // Clear any existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Refresh token every 45 minutes (before 1-hour expiry)
        this.refreshInterval = setInterval(async () => {
            await this.refreshSupabaseSession();
        }, 45 * 60 * 1000); // 45 minutes

        console.log('🔄 Token refresh scheduler started');
    }

    /**
     * Setup listener for tab/window visibility changes
     * Refresh session when user returns to the tab
     */
    private setupVisibilityListener() {
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && this.tokenRefreshCallback) {
                console.log('👁️ Tab became visible, refreshing session...');
                await this.refreshSupabaseSession();
            }
        });

        // Also refresh on window focus
        window.addEventListener('focus', async () => {
            if (this.tokenRefreshCallback) {
                console.log('🎯 Window focused, refreshing session...');
                await this.refreshSupabaseSession();
            }
        });
    }

    /**
     * Refresh Supabase session with fresh Clerk token
     */
    async refreshSupabaseSession(): Promise<boolean> {
        if (!this.tokenRefreshCallback) {
            console.warn('⚠️ Token refresh callback not initialized (user may not be logged in yet)');
            return false;
        }

        try {
            console.log('🔄 Refreshing Supabase session...');

            // Get fresh token from Clerk
            const token = await this.tokenRefreshCallback();

            if (!token) {
                console.error('❌ Failed to get fresh token from Clerk');
                return false;
            }

            // Update Supabase session with fresh token
            const { error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: 'clerk-managed-refresh', // Clerk manages refresh
            });

            if (error) {
                console.error('❌ Error refreshing Supabase session:', error);
                return false;
            }

            console.log('✅ Supabase session refreshed successfully');
            return true;
        } catch (error) {
            console.error('❌ Unexpected error refreshing session:', error);
            return false;
        }
    }

    /**
     * Verify current session is valid
     */
    async verifySession(): Promise<boolean> {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                console.warn('⚠️ No valid Supabase session found, attempting refresh...');
                return await this.refreshSupabaseSession();
            }

            // Check if token is about to expire (within 5 minutes)
            const expiresAt = session.expires_at || 0;
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = expiresAt - now;

            if (timeUntilExpiry < 300) { // Less than 5 minutes
                console.warn('⚠️ Token expiring soon, refreshing...');
                return await this.refreshSupabaseSession();
            }

            console.log('✅ Session valid, expires in', Math.floor(timeUntilExpiry / 60), 'minutes');
            return true;
        } catch (error) {
            console.error('❌ Error verifying session:', error);
            return false;
        }
    }

    /**
     * Cleanup on logout
     */
    cleanup() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        this.tokenRefreshCallback = null;
        console.log('🧹 Session manager cleaned up');
    }

    /**
     * Force immediate session refresh
     */
    async forceRefresh(): Promise<boolean> {
        console.log('🔄 Force refreshing session...');
        return await this.refreshSupabaseSession();
    }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

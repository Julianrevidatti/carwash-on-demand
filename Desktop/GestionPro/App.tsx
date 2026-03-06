import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Menu, Loader2, AlertTriangle, Lock, LogOut } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Session } from '@supabase/supabase-js'; // SUPABASE AUTH
import { supabase } from './src/lib/supabase';
import { useStore } from './src/store/useStore';
import { User, SaaSClient } from './types';
import { deductStockFromBatches } from './services/inventoryService';
import { expenseService } from './src/services/expenseService'; // ADDED
import { INITIAL_PRODUCTS, INITIAL_BATCHES, INITIAL_SUPPLIERS, INITIAL_CLIENTS, INITIAL_PAYMENT_METHODS, INITIAL_SETTINGS, INITIAL_PROMOTIONS } from './src/data/initialData';

// Lazy Loaded Components
const DashboardV2 = lazy(() => import('./components/DashboardV2').then(m => ({ default: m.DashboardV2 })));
const InventoryV2 = lazy(() => import('./components/InventoryV2').then(m => ({ default: m.InventoryV2 })));
const POS = lazy(() => import('./components/POS').then(m => ({ default: m.POS })));
const CashControl = lazy(() => import('./components/CashControl').then(m => ({ default: m.CashControl })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const DataReports = lazy(() => import('./components/DataReports').then(m => ({ default: m.DataReports })));
const CashFlow = lazy(() => import('./components/CashFlow').then(m => ({ default: m.CashFlow })));
const Suppliers = lazy(() => import('./components/Suppliers').then(m => ({ default: m.Suppliers })));
const Promotions = lazy(() => import('./components/Promotions').then(m => ({ default: m.Promotions })));
const SaaSAdmin = lazy(() => import('./components/SaaSAdmin').then(m => ({ default: m.SaaSAdmin })));
const Clients = lazy(() => import('./src/components/Clients').then(m => ({ default: m.Clients })));
const ExpensesManager = lazy(() => import('./components/ExpensesManager').then(m => ({ default: m.ExpensesManager })));
const Tutorials = lazy(() => import('./components/Tutorials').then(m => ({ default: m.Tutorials })));

import { Sidebar } from './components/Sidebar';
import { LandingPage } from './components/LandingPage';
import { SubscriptionModal } from './components/SubscriptionModal';
import { SessionLockScreen } from './components/SessionLockScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { OperatorLockScreen } from './components/OperatorLockScreen';
import { SupabaseAuthLogin } from './components/SupabaseAuthLogin';
import { usePlanPermissions } from './hooks/usePlanPermissions';
import { useUserPermissions } from './hooks/useUserPermissions';
import { PERMISSIONS } from './config/permissions';

const AccessDenied = () => (
  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-10 animate-in fade-in zoom-in">
    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
      <Lock className="w-8 h-8 text-slate-500" />
    </div>
    <h2 className="text-xl font-bold text-slate-600">Acceso Restringido</h2>
    <p className="text-sm">No tienes permisos para ver esta sección.</p>
  </div>
);

// SYSTEM OWNER CONFIGURATION
const SYSTEM_OWNER_EMAIL = "julianrevidatti817@gmail.com";

import { PublicCatalog } from './components/PublicCatalog'; // ADDED
import { PaymentSuccessPage } from './components/PaymentSuccessPage'; // PAYMENT CONFIRMATION
import { GraceWarningModal } from './components/GraceWarningModal'; // GRACE PERIOD WARNING
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';

const MainApp: React.FC = () => {

  // Supabase Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global State - Optimized Selectors
  const currentUser = useStore(state => state.currentUser);
  const currentTenant = useStore(state => state.currentTenant);
  const activeOperator = useStore(state => state.activeOperator); // NEW
  const setCurrentUser = useStore(state => state.setCurrentUser);
  const setCurrentTenant = useStore(state => state.setCurrentTenant);
  const products = useStore(state => state.products);
  const paymentMethods = useStore(state => state.paymentMethods);

  // Actions
  const addProduct = useStore(state => state.addProduct);
  const addBatch = useStore(state => state.addBatch);
  const addSupplier = useStore(state => state.addSupplier);
  const addClient = useStore(state => state.addClient);
  const addPromotion = useStore(state => state.addPromotion);
  const updatePaymentMethods = useStore(state => state.updatePaymentMethods);
  const updateSettings = useStore(state => state.updateSettings);
  const setExpenses = useStore(state => state.setExpenses); // ADDED

  // Other state needed for rendering
  const saasClients = useStore(state => state.saasClients);
  const registerTenant = useStore(state => state.registerTenant);
  const updateTenant = useStore(state => state.updateTenant);
  const batches = useStore(state => state.batches);
  const suppliers = useStore(state => state.suppliers);
  const massUpdatePrices = useStore(state => state.massUpdatePrices);
  const setBatches = useStore(state => state.setBatches);
  const updateBatches = useStore(state => state.updateBatches);
  const stockMovements = useStore(state => state.stockMovements);
  const addStockMovement = useStore(state => state.addStockMovement);
  const sales = useStore(state => state.sales);
  const updateSalePaymentMethod = useStore(state => state.updateSalePaymentMethod);
  const sessions = useStore(state => state.sessions);
  const currentSession = useStore(state => state.currentSession);
  const cashMovements = useStore(state => state.cashMovements);
  const clients = useStore(state => state.clients);
  const addSale = useStore(state => state.addSale);
  const openSession = useStore(state => state.openSession);
  const closeSession = useStore(state => state.closeSession);
  const addCashMovement = useStore(state => state.addCashMovement);
  const updateProduct = useStore(state => state.updateProduct);
  const deleteProduct = useStore(state => state.deleteProduct);
  const updateClient = useStore(state => state.updateClient);
  const settings = useStore(state => state.settings);
  const promotions = useStore(state => state.promotions);
  const systemUsers = useStore(state => state.systemUsers);
  const deletePromotion = useStore(state => state.deletePromotion);
  const addSystemUser = useStore(state => state.addSystemUser);
  const updateSystemUser = useStore(state => state.updateSystemUser);
  const deleteSystemUser = useStore(state => state.deleteSystemUser);

  const updateSupplier = useStore(state => state.updateSupplier);
  const deleteSupplier = useStore(state => state.deleteSupplier);
  const transferProducts = useStore(state => state.transferProducts);
  const bulkProducts = useStore(state => state.bulkProducts);
  const addBulkProduct = useStore(state => state.addBulkProduct);
  const updateBulkProduct = useStore(state => state.updateBulkProduct);
  const deleteBulkProduct = useStore(state => state.deleteBulkProduct);
  const deductBulkStock = useStore(state => state.deductBulkStock);
  const deleteSale = useStore(state => state.deleteSale);

  // Local UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLocked, setIsLocked] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { isLockedByLicense, daysRemaining, isInGracePeriod, graceDaysRemaining } = usePlanPermissions();
  const { hasPermission } = useUserPermissions();

  const [showLanding, setShowLanding] = useState(true); // Landing page state
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false); // Payment success page state
  const [showGraceWarning, setShowGraceWarning] = useState(false); // Grace period warning modal



  // DEBUG: Connection Status
  const [debugStatus, setDebugStatus] = useState<{
    clerk: string;
    token: string;
    supabase: string;
    tenant: string;
    sessionRefresh: string;
    error?: string;
  }>({ clerk: 'Checking...', token: '...', supabase: '...', tenant: '...', sessionRefresh: '...' });

  // Supabase Auth Listener
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track if user data has been loaded to prevent infinite loop
  const userLoadedRef = useRef(false);

  // Load user data when session exists
  useEffect(() => {
    if (!session) {
      setCurrentUser(null);
      userLoadedRef.current = false;
      return;
    }

    const userId = session.user.id;

    // Skip if already loaded
    if (userLoadedRef.current) {
      return;
    }

    const loadUserData = async () => {
      try {
        userLoadedRef.current = true;
        const userEmail = session.user.email;

        // Check or create tenant (protected by userLoadedRef)
        const { data: tenant, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('user_id', userId)
          .single();

        const expiryDate = tenant?.next_due_date
          ? new Date(tenant.next_due_date).toISOString()
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        // Set current user
        const appUser: User = {
          id: userId,
          name: userEmail?.split('@')[0] || 'Usuario',
          username: userEmail || 'user',
          role: userEmail === SYSTEM_OWNER_EMAIL ? 'sysadmin' : 'admin',
          subscriptionExpiry: userEmail === SYSTEM_OWNER_EMAIL
            ? new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000).toISOString()
            : expiryDate
        };
        setCurrentUser(appUser);

        // If SysAdmin, fetch ALL tenants for the dashboard
        if (appUser.role === 'sysadmin') {
          useStore.getState().fetchAllTenants();
        }

        if (error && error.code === 'PGRST116') {
          // Tenant doesn't exist, create it
          const newTenant = {
            id: crypto.randomUUID(),
            business_name: userEmail?.split('@')[0] || 'Mi Negocio',
            contact_name: userEmail || '',
            user_id: userId,
            status: 'ACTIVE',
            payment_status: 'PENDING',
            pricing_plan: 'FREE',
            next_due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };

          const { data: createdTenant, error: createError } = await supabase
            .from('tenants')
            .insert([newTenant])
            .select()
            .single();

          if (createError) {
            console.error('Error creating tenant:', createError);
            toast.error('Error al crear cuenta');
            userLoadedRef.current = false; // Reset to allow retry
          } else {
            console.log('✅ Tenant created:', createdTenant);
            // SET TENANT IN STORE
            const tenantForStore: SaaSClient = {
              id: createdTenant.id,
              businessName: createdTenant.business_name,
              contactName: createdTenant.contact_name,
              status: createdTenant.status as any,
              paymentStatus: createdTenant.payment_status as any,
              pricingPlan: createdTenant.pricing_plan as any,
              adminUsername: createdTenant.contact_name,
              userId: createdTenant.user_id,
              nextDueDate: createdTenant.next_due_date,
              lastLogin: new Date().toISOString(),
              pendingAmount: 0,
              paymentMethod: 'TBD'
            };
            setCurrentTenant(tenantForStore);
            toast.success('¡Bienvenido a GestionPro!');
          }
        } else if (!error) {
          console.log('✅ Tenant loaded:', tenant);
          const tenantForStore: SaaSClient = {
            id: tenant.id,
            businessName: tenant.business_name,
            contactName: tenant.contact_name,
            status: tenant.status as any,
            paymentStatus: tenant.payment_status as any,
            pricingPlan: tenant.pricing_plan as any,
            adminUsername: tenant.contact_name,
            lastLogin: new Date().toISOString(),
            pendingAmount: 0,
            paymentMethod: 'TBD',
            userId: tenant.user_id,
            nextDueDate: tenant.next_due_date,
            gracePeriodStart: tenant.grace_period_start
          };
          setCurrentTenant(tenantForStore);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        userLoadedRef.current = false;
      }
    };

    loadUserData();
  }, [session, currentUser]); // Added currentUser to dependencies to react to its changes

  // Initialize Session Manager for Multi-Device Support
  /* COMMENTED OUT - CLERK CODE
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Initialize session manager with token refresh callback
      sessionManager.initialize(async () => {
        try {
          const token = await getToken({ template: 'supabase' });
          return token;
        } catch (error) {
          console.error('Error getting token for session refresh:', error);
          return null;
        }
      });

      // Verify session immediately
      sessionManager.verifySession();

      console.log('✅ Session manager initialized for multi-device support');
    }

    // Cleanup on logout
    return () => {
      if (!isSignedIn) {
        sessionManager.cleanup();
      }
    };
  }, [isLoaded, isSignedIn, getToken]);
  */

  /* COMMENTED OUT - CLERK DEBUG CODE
  useEffect(() => {
    const checkConnection = async () => {
      const token = await getToken({ template: 'supabase' });
      const { data: { session } } = await supabase.auth.getSession();
      const sessionValid = await sessionManager.verifySession();

      setDebugStatus({
        clerk: isSignedIn ? `Signed In (${user?.primaryEmailAddress?.emailAddress})` : 'Signed Out',
        token: token ? 'Token Present (OK)' : 'Token MISSING (Check Clerk Dashboard)',
        supabase: session ? 'Session Active (OK)' : 'Session Missing',
        tenant: currentTenant ? `Set (${currentTenant.businessName})` : 'Not Set',
        sessionRefresh: sessionValid ? 'Auto-Refresh Active ✓' : 'Refresh Failed ✗',
      });
    };

    if (isLoaded) checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, user, currentTenant, getToken]);
  */

  /* COMMENTED OUT - CLERK USER SYNC
  // SYNC CLERK USER TO APP STATE
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const isSystemOwner = userEmail === SYSTEM_OWNER_EMAIL;

      // Check if user is already in store or needs to be set
      if (!currentUser || currentUser.id !== user.id) {
        const appUser: User = {
          id: user.id,
                const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('domain', userEmail)
                    .single();

                const expiryDate = tenantData?.next_due_date
                    ? new Date(tenantData.next_due_date).toISOString()
                    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

                useStore.getState().setCurrentUser({
                    id: user.id,
                    email: userEmail,
                    role: userEmail === SYSTEM_OWNER_EMAIL ? 'sysadmin' : 'admin',
                    subscriptionExpiry: userEmail === SYSTEM_OWNER_EMAIL
                        ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString()
                        : expiryDate,
                    profileImage: user.user_metadata.avatar_url,
                });
// Register Tenant Logic (Sync with Supabase using Email)
      const checkAndRegisterTenant = async () => {
        if (!userEmail) return;

        // AUTH TOKEN EXCHANGE
        try {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            const { error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: 'dummy-refresh-token', // Clerk handles refresh, this is just to satisfy Supabase client
            });
            if (error) console.error("Error setting Supabase session:", error);
            else console.log("Supabase session set with Clerk token");
          }
        } catch (err) {
          console.error("Error getting Clerk token:", err);
        }

        // 1. Check if already in local state
        if (currentTenant && currentTenant.contactName === userEmail) {
          return;
        }

        console.log("DEBUG: Checking tenant for email:", userEmail);

        // 2. Check if Tenant exists by EMAIL or ID
        const fetchedTenant = await useStore.getState().fetchTenantByEmail(userEmail, user.id);

        if (fetchedTenant) {
          console.log("DEBUG: Tenant found and set:", fetchedTenant);
          // Data fetching will happen in a separate effect dependent on currentTenant
        } else {
          console.log("DEBUG: Tenant not found. Registering...");

          const newTenant: SaaSClient = {
            id: crypto.randomUUID(),
            businessName: isSystemOwner ? "Mi Negocio (Principal)" : "Mi Negocio (Default)",
            contactName: userEmail,
            lastLogin: new Date().toISOString(),
            status: 'ACTIVE',
            paymentStatus: isSystemOwner ? 'PAID' : 'PENDING',
            pendingAmount: 0,
            pricingPlan: isSystemOwner ? 'ULTIMATE' : 'PRO',
            paymentMethod: isSystemOwner ? 'INTERNAL' : 'TBD',
            nextDueDate: isSystemOwner
              ? new Date(Date.now() + 365 * 10 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            adminUsername: userEmail,
            lastPaymentDate: isSystemOwner ? new Date().toISOString() : undefined,
            userId: user.id // Bind to Clerk ID
          };

          try {
            toast.info("Registrando tu negocio en la base de datos...");
            await registerTenant(newTenant);
            toast.success("¡Negocio registrado correctamente!");
            // registerTenant now sets currentTenant, so the effect will pick it up
          } catch (error: any) {
            console.error("DEBUG: Registration failed:", error);
            toast.error("Error al registrar el negocio", {
              description: error.message || "Por favor contacta a soporte."
            });
          }
        }
      };

      checkAndRegisterTenant();

      // If SysAdmin, fetch ALL tenants for the dashboard
      if (isSystemOwner) {
        useStore.getState().fetchAllTenants();
      }

    } else if (isLoaded && !isSignedIn) {
      setCurrentUser(null);
    }
  }, [isLoaded, isSignedIn, user, currentUser, setCurrentUser, registerTenant, updateTenant]); // REMOVED currentTenant to prevent infinite loop
  */

  // DATA FETCHING EFFECT - Triggers when currentTenant is set
  const dataFetchedRef = useRef(false);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset fetch flag when user changes (account switch)
    if (currentUser?.id !== lastUserIdRef.current) {
      dataFetchedRef.current = false;
      lastUserIdRef.current = currentUser?.id || null;
    }

    if (!currentUser || !useStore.getState().currentTenant || dataFetchedRef.current) {
      return;
    }

    console.log("DEBUG: Current Tenant set, fetching all data...");
    dataFetchedRef.current = true;

    const fetchData = () => {
      const tenantId = useStore.getState().currentTenant?.id;
      if (!tenantId) {
        console.error("Tenant ID not available for data fetching.");
        return;
      }

      // 1. Fetch Payment Methods and CRITICAL settings immediately
      useStore.getState().fetchSettings();
      useStore.getState().fetchPaymentMethods().then(() => {
        const pm = useStore.getState().paymentMethods;
        const role = useStore.getState().currentUser?.role;
        // 2. Payment Methods Seeding (For ANY Admin/SysAdmin if missing)
        if (pm.length === 0 && (role === 'admin' || role === 'sysadmin')) {
          console.log("Seeding payment methods after fetch...");
          useStore.getState().updatePaymentMethods(INITIAL_PAYMENT_METHODS);
        }

        // 3. ONLY AFTER Payment Methods load, blast the network with heavy queries.
        // This ensures the POS has payment methods instantly, even if the 3000 sales take a minute.
        Promise.all([
          useStore.getState().fetchProducts(),
          useStore.getState().fetchSales(),
          useStore.getState().fetchSessions()
        ]).then(() => {
          // 4. SysAdmin Specific Seeding (Products, etc.)
          const state = useStore.getState();
          if (state.currentUser?.role === 'sysadmin' && (state.products.length === 0 || state.suppliers.length === 0)) {
            console.log("Seeding initial data for SysAdmin after fetch...");
            Promise.all([
              state.seedSuppliers(INITIAL_SUPPLIERS),
              state.seedClients(INITIAL_CLIENTS),
              state.seedProducts(INITIAL_PRODUCTS),
              state.seedBatches(INITIAL_BATCHES),
              state.seedPromotions(INITIAL_PROMOTIONS),
              state.updateSettings(INITIAL_SETTINGS)
              // Payment methods handled above
            ]);
          }
        }); // Close the then() for Promise.all

      }); // <-- THIS CLOSES useStore.getState().fetchPaymentMethods().then(() => {

      // Load Expenses (NEW)
      expenseService.getExpenses(tenantId).then(loadedExpenses => {
        useStore.getState().setExpenses(loadedExpenses);
      }).catch(err => {
        console.error("Failed to load expenses", err);
      });

    };
    fetchData();

    // SUPABASE REALTIME SUBSCRIPTION
    // Listen for changes in sales and sessions to provide instant sync
    const currentTenantId = useStore.getState().currentTenant?.id;
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: currentTenantId ? `tenant_id=eq.${currentTenantId}` : undefined },
        () => {
          console.log("REALTIME: Sales changed, fetching...");
          useStore.getState().fetchSales();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cash_sessions', filter: currentTenantId ? `tenant_id=eq.${currentTenantId}` : undefined },
        () => {
          console.log("REALTIME: Sessions changed, fetching...");
          useStore.getState().fetchSessions();
        }
      )
      .subscribe();

    // REALTIME: Tenant Changes (Locking / Plan switching)
    const tenantChannel = supabase
      .channel('tenant-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tenants', filter: currentTenantId ? `id=eq.${currentTenantId}` : undefined },
        (payload) => {
          console.log("REALTIME: Tenant updated, refreshing...", payload);
          if (currentTenantId) {
            useStore.getState().fetchCurrentTenant(currentTenantId);
          }
        }
      )
      .subscribe();

    // PERIODIC REFRESH (Fallback sync)
    // Refresh sales and sessions every 60 seconds as a backup
    const refreshInterval = setInterval(async () => {
      console.log("DEBUG: Periodic refresh triggered...");
      const state = useStore.getState();
      if (state.currentTenant?.id) {
        await Promise.all([
          state.fetchSales(),
          state.fetchSessions(),
          state.fetchCurrentTenant(state.currentTenant.id)
        ]);
      }
    }, 60000); // 60 seconds

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tenantChannel);
      clearInterval(refreshInterval);
    };
  }, [currentUser]); // Only depend on currentUser



  // Track if data has been seeded to prevent infinite loop
  const dataSeededRef = useRef(false);
  const lastSeededUserIdRef = useRef<string | null>(null);

  // Data Seeding Effect
  useEffect(() => {
    // Reset seed flag when user changes
    if (currentUser?.id !== lastSeededUserIdRef.current) {
      dataSeededRef.current = false;
      lastSeededUserIdRef.current = currentUser?.id || null;
    }

    if (!currentUser || dataSeededRef.current) {
      return;
    }

    // SEEDING LOGIC MOVED TO fetchData() to prevent race conditions
  }, [currentUser]); // Only depend on currentUser



  // Subscription Check Effect with Grace Period Management
  useEffect(() => {
    console.log('🚀 GRACE PERIOD DEBUG - Effect triggered:', {
      hasCurrentUser: !!currentUser,
      currentUserRole: currentUser?.role,
      currentUserName: currentUser?.username,
      saasClientsCount: saasClients.length
    });

    // Use currentTenant for regular users, saasClients for SysAdmin
    const tenantToCheck = currentUser?.role === 'sysadmin'
      ? saasClients.find(c => c.contactName === currentUser?.username)
      : currentTenant;

    if (currentUser && tenantToCheck) {
      const myTenant = tenantToCheck;

      console.log('🔍 GRACE PERIOD DEBUG - Tenant Search:', {
        searchingFor: currentUser.username,
        found: !!myTenant,
        source: currentUser.role === 'sysadmin' ? 'saasClients' : 'currentTenant'
      });

      if (myTenant) {
        console.log('🔍 GRACE PERIOD DEBUG - Tenant Data:', {
          businessName: myTenant.businessName,
          pricingPlan: myTenant.pricingPlan,
          nextDueDate: myTenant.nextDueDate,
          gracePeriodStart: myTenant.gracePeriodStart,
          status: myTenant.status
        });

        // Skip checks for SysAdmin
        if (currentUser.role === 'sysadmin') {
          console.log('⚠️ GRACE PERIOD DEBUG - Skipping checks for SysAdmin');
          return;
        }

        const today = new Date();
        const dueDate = new Date(myTenant.nextDueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        // Use floor to ensure we don't count partial days as full overdue days immediately
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log('🔍 GRACE PERIOD DEBUG - Date Calculations:', {
          today: today.toISOString(),
          dueDate: dueDate.toISOString(),
          diffDays,
          diffTime
        });

        // Grace Period Calculation - Derived strictly from the due date
        const isPaidPlan = myTenant.pricingPlan !== 'FREE';
        const gracePeriodDays = isPaidPlan ? 5 : 0;

        const daysExpired = diffDays < 0 ? Math.abs(diffDays) : 0;
        const graceDaysRemaining = Math.max(0, gracePeriodDays - daysExpired);

        // Only show warning if we are actually in grace period (expired but not exhausted)
        const isInGracePeriod = diffDays <= 0 && graceDaysRemaining > 0 && isPaidPlan;

        console.log('🔍 GRACE PERIOD DEBUG - Grace Calculations:', {
          diffDays,
          daysExpired,
          gracePeriodDays,
          graceDaysRemaining
        });

        // Auto-lock if grace period expired
        const isGraceExpired = diffDays <= 0 && graceDaysRemaining === 0;

        if (isGraceExpired && myTenant.status !== 'LOCKED') {
          console.log('🔒 Bloqueando acceso por vencimiento de grace period:', myTenant.businessName);
          updateTenant({ ...myTenant, status: 'LOCKED' });
        }

        // Show warning modal on each login if in grace period
        const shouldShowModal = diffDays <= 0 && graceDaysRemaining > 0 && isPaidPlan;
        console.log('🔍 GRACE PERIOD DEBUG - Modal Display:', {
          shouldShowModal,
          diffDaysLessThanZero: diffDays <= 0,
          graceDaysLeftGreaterThanZero: graceDaysRemaining > 0,
          isPaidPlan
        });

        if (shouldShowModal) {
          console.log('🚨 MOSTRANDO MODAL DE GRACE PERIOD - Días restantes:', graceDaysRemaining);
          setShowGraceWarning(true);
        }
      }
    }
  }, [currentUser, saasClients, updateTenant, currentTenant]);

  // Handlers (Wrappers around Store Actions)
  const handleLogout = async () => {
    await supabase.auth.signOut();

    // Clear all user state
    setCurrentUser(null);
    setCurrentTenant(null);

    // Reset data fetch flags so fresh data loads on next login
    userLoadedRef.current = false;
    dataFetchedRef.current = false;
    dataSeededRef.current = false;
    lastUserIdRef.current = null;
    lastSeededUserIdRef.current = null;

    // Show landing page again after logout
    setShowLanding(true);

    toast.success('Sesión cerrada');
  };

  const handleNewSale = async (sale: any) => {
    // Separate items for UI validation (optional, keeps UI responsive)
    const bulkItems = (sale.items || []).filter((i: any) => i.isWeighted);

    // OPTIONAL: Quick UI check before Network Call (improves UX)
    if (bulkItems.length > 0) {
      for (const item of bulkItems) {
        const bulkProd = bulkProducts.find(p => p.id === item.id);
        if (!bulkProd) {
          toast.error(`Producto "${item.name}" no encontrado`);
          return;
        }
        if (bulkProd.stockKg < item.quantity) {
          toast.error(`Stock insuficiente de "${item.name}". Disponible: ${bulkProd.stockKg.toFixed(2)} kg`);
          return;
        }
      }
    }

    // ATOMIC TRANSACTION:
    // All logic (Header, Items, Stock, Money, Debt) is now handled by addSale -> RPC
    try {
      await addSale(sale);
      // Success is handled in addSale
    } catch (error) {
      // Error is handled in addSale
      console.error("Sale failed:", error);
    }
  };

  const handleOpenSession = (initialFloat: number) => {
    const newSession: import('./types').CashSession = {
      id: crypto.randomUUID(),
      startTime: new Date().toISOString(),
      initialFloat,
      status: 'OPEN',
      userId: currentUser?.id || 'unknown',
      userName: currentUser?.name || 'Unknown'
    };
    openSession(newSession);
  };

  const handleCloseSession = (finalCash: number) => {
    if (currentSession) {
      closeSession(currentSession.id, finalCash, new Date().toISOString());
    }
  };

  // Loading State
  /* COMMENTED OUT - CLERK LOADING CHECK
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }
  */

  // Check if URL contains payment-success route
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/payment-success') || window.location.search.includes('external_reference')) {
      setShowPaymentSuccess(true);
    }
  }, []);

  // Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  // Payment Success View (Public, no auth required for redirect)
  if (showPaymentSuccess) {
    return <PaymentSuccessPage onGoHome={() => {
      setShowPaymentSuccess(false);
      window.history.pushState({}, '', '/');
    }} />;
  }

  // --- LOCK SCREEN OVERLAY ---
  if (currentUser && isLocked && systemUsers.length > 0) {
    // Combine Owner (if has PIN) and System Users for the lock screen list
    // Deduplicate: Filter currentUser out of systemUsers before joining
    const uniqueSystemUsers = systemUsers.filter(u => u.id !== currentUser.id);
    const lockScreenUsers = [currentUser, ...uniqueSystemUsers];

    // Cleanup debug logs
    // console.log("LOCK SCREEN DEBUG:", ...);

    return (
      <OperatorLockScreen
        users={lockScreenUsers}
        onUnlock={(user) => {
          setCurrentUser(user); // Switch context to this user
          setIsLocked(false);
        }}
      />
    );
  }

  // Not authenticated - show landing page or login
  if (!session) {
    if (showLanding) {
      return <LandingPage onGoToLogin={() => setShowLanding(false)} />;
    }
    return <SupabaseAuthLogin />;
  }

  // Authenticated but loading user data

  // Signed in but syncing state
  // Signed in but syncing state
  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-6 bg-gray-50">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-xs">GN</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-gray-800">Iniciando Sistema</h3>
          <p className="text-sm text-gray-500 animate-pulse">
            {!currentUser ? 'Verificando credenciales...' : 'Cargando datos de tu negocio...'}
          </p>
        </div>
      </div>
    );
  }

  // System Admin View
  if (currentUser.role === 'sysadmin') {
    return (
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-500">Cargando panel de administración...</p>
          </div>
        </div>
      }>
        <SaaSAdmin
          onLogout={handleLogout}
          currentUser={currentUser}
          clients={saasClients}
          onUpdateClients={(clients) => clients.forEach(updateTenant)} // Adapter
          onRegisterTenant={async (data, creds) => {
            // Validate required fields
            if (!data.businessName || !creds.username || !creds.password) {
              toast.error('Faltan campos obligatorios', { description: 'Nombre de negocio, email y contraseña son obligatorios' });
              return;
            }

            const loadingToast = toast.loading('Creando cuenta de cliente...');

            try {
              const result = await useStore.getState().createTenantUser({
                email: creds.username,
                password: creds.password,
                businessName: data.businessName,
                pricingPlan: data.pricingPlan || 'PRO',
                address: data.address,
                cuit: data.cuit
              });

              if (result.success) {
                toast.success('¡Cliente registrado exitosamente!', {
                  id: loadingToast,
                  description: 'Credenciales listas para entregar.'
                });
              } else {
                toast.error('Error al registrar', {
                  id: loadingToast,
                  description: result.error
                });
              }
            } catch (error: any) {
              toast.error('Error inesperado', {
                id: loadingToast,
                description: error.message
              });
            }
          }}
          onToggleStatus={(id) => {
            const client = saasClients.find(c => c.id === id);
            if (client) updateTenant({ ...client, status: client.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' });
          }}
          onDeleteTenant={async (id) => {
            try {
              await useStore.getState().deleteTenant(id);
              toast.success('Cliente eliminado correctamente');
            } catch (error) {
              toast.error('Error al eliminar cliente');
            }
          }}
          onRenewLicense={(id, days) => {
            const client = saasClients.find(c => c.id === id);
            if (client) {
              const today = new Date();
              const currentExpiry = new Date(client.nextDueDate);
              let newDueDate = currentExpiry < today ? new Date(today) : new Date(currentExpiry);
              newDueDate.setDate(newDueDate.getDate() + days);
              updateTenant({ ...client, nextDueDate: newDueDate.toISOString(), status: 'ACTIVE', paymentStatus: 'PAID', pendingAmount: 0, gracePeriodStart: undefined });
            }
          }}
        />
      </Suspense>
    );
  }

  // 4. Checking License Status
  if (isLockedByLicense) {
    return <SubscriptionModal isOpen={true} onClose={() => { }} />;
  }

  // 5. Operator Lock Screen (NEW)
  // If we are logged in (Tenant) but no specific operator is selected -> LOCK
  // But ONLY if there are users created! If no users exist yet (first run), we should probably let the Main User act as Operator for setup.
  // OR force them to creating a profile.
  // Let's assume: If systemUsers.length > 0 && !activeOperator, enforce Lock Screen.
  if (systemUsers.length > 0 && !activeOperator) {
    // Deduplicate for Auto-Lock too
    const uniqueSystemUsers = systemUsers.filter(u => u.id !== currentUser.id);
    const autoLockUsers = [currentUser, ...uniqueSystemUsers];

    return (
      <OperatorLockScreen
        users={autoLockUsers}
        onUnlock={(user) => {
          // Set the active operator to bypass the lock check
          useStore.getState().setActiveOperator(user);
          // Also set as current user for the UI context
          setCurrentUser(user);
          toast.success(`Turno iniciado: ${user.name}`);
        }}
      />
    );
  }

  // Regular Kiosk Logic
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (!hasPermission(PERMISSIONS.DASHBOARD_VIEW)) return <AccessDenied />;
        return <DashboardV2 sales={sales} products={products} batches={batches} clients={clients} suppliers={suppliers} onNavigate={setActiveTab} settings={settings} />;

      case 'pos':
        if (!hasPermission(PERMISSIONS.POS_ACCESS)) return <AccessDenied />;
        if (!currentSession || currentSession.status === 'CLOSED') {
          return <SessionLockScreen onNavigateToCash={() => setActiveTab('cash_control')} />;
        }
        return <POS
          products={products}
          clients={clients}
          paymentMethods={paymentMethods}
          onCompleteSale={handleNewSale}
          currentSession={currentSession}
          batches={batches}
          promotions={promotions}
          settings={settings}
          onNavigateToCash={() => setActiveTab('cash_control')}
          bulkProducts={bulkProducts}
        />;

      case 'products':
        if (!hasPermission(PERMISSIONS.INVENTORY_MANAGE)) return <AccessDenied />;
        return <InventoryV2
          products={products}
          batches={batches}
          suppliers={suppliers}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onAddBatch={addBatch}
          onAddSupplier={addSupplier}
          onMassUpdate={() => { }}
          onImportCSV={() => { }}
          settings={settings}
          initialTab="catalog"
          stockMovements={stockMovements} // ADDED
          onAddStockMovement={addStockMovement} // ADDED
          onUpdateBatches={updateBatches} // ADDED
        />;

      case 'inventory':
        if (!hasPermission(PERMISSIONS.INVENTORY_MANAGE)) return <AccessDenied />;
        return <InventoryV2
          products={products}
          batches={batches}
          suppliers={suppliers}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
          onAddBatch={addBatch}
          onAddSupplier={addSupplier}
          onMassUpdate={() => { }} // Placeholder if needed
          onImportCSV={() => { }}
          settings={settings}
          initialTab="logistics"
          stockMovements={stockMovements} // ADDED
          onAddStockMovement={addStockMovement} // ADDED
          onUpdateBatches={updateBatches} // ADDED
          bulkProducts={bulkProducts}
          onAddBulkProduct={addBulkProduct}
          onUpdateBulkProduct={updateBulkProduct}
          onDeleteBulkProduct={deleteBulkProduct}
        />;



      case 'cash_control':
        if (!hasPermission(PERMISSIONS.POS_CLOSE_CASH)) return <AccessDenied />;
        return <CashControl
          currentSession={currentSession}
          onOpenSession={handleOpenSession}
          onCloseSession={handleCloseSession}
          todaySales={sales}
          paymentMethods={paymentMethods}
          cashMovements={cashMovements}
          sessions={sessions}
        />;

      case 'reports':
        if (!hasPermission(PERMISSIONS.REPORTS_VIEW)) return <AccessDenied />;
        return <DataReports
          sales={sales}
          products={products}
          bulkProducts={bulkProducts}
          suppliers={suppliers}
          sessions={sessions}
          users={systemUsers}
          paymentMethods={paymentMethods}
          cashMovements={cashMovements}
          currentSessionId={currentSession?.id}
          onUpdateSalePaymentMethod={updateSalePaymentMethod}
          onDeleteSale={deleteSale}
          promotions={promotions}
        />;

      case 'cash_flow':
        if (!hasPermission(PERMISSIONS.POS_VIEW_CASH_FLOW)) return <AccessDenied />;
        return <CashFlow
          movements={cashMovements}
          sales={sales}
          onAddMovement={addCashMovement}
          currentSessionId={currentSession?.id}
        />;

      case 'suppliers':
        if (!hasPermission(PERMISSIONS.SUPPLIERS_MANAGE)) return <AccessDenied />;
        return <Suppliers
          suppliers={suppliers}
          products={products}
          batches={batches}
          onAddSupplier={addSupplier}
          onUpdateSupplier={updateSupplier}
          onDeleteSupplier={deleteSupplier}
          onTransferProducts={transferProducts}
          onMassUpdate={massUpdatePrices}
        />;

      case 'promotions':
        if (!hasPermission(PERMISSIONS.PROMOTIONS_MANAGE)) return <AccessDenied />;
        return (
          <Promotions
            promotions={promotions}
            products={products}
            bulkProducts={bulkProducts}
            sales={sales}
            batches={batches} // Assuming 'batches' is the correct prop name, not 'inventoryBatches'
            onAddPromotion={addPromotion}
            onUpdatePromotion={useStore.getState().updatePromotion}
            onDeletePromotion={deletePromotion}
          />
        );

      case 'expenses':
        if (!hasPermission(PERMISSIONS.EXPENSES_MANAGE)) return <AccessDenied />;
        return (
          <div className="p-6">
            <ExpensesManager />
          </div>
        );

      case 'clients':
        if (!hasPermission(PERMISSIONS.CLIENTS_MANAGE)) return <AccessDenied />;
        return <Clients />;

      case 'settings':
        if (!hasPermission(PERMISSIONS.ADMIN_SETTINGS)) return <AccessDenied />;
        return <Settings
          paymentMethods={paymentMethods}
          onUpdatePaymentMethods={updatePaymentMethods}
          clients={clients}
          onUpdateClients={(newClients) => {
            // ... existing placeholder ...
          }}
          currentSession={currentSession}
          onAddCashMovement={addCashMovement}
          settings={settings}
          onUpdateSettings={updateSettings}
          systemUsers={systemUsers}
          onAddUser={addSystemUser}
          onUpdateUser={updateSystemUser}
          onDeleteUser={deleteSystemUser}
          currentUserRole={currentUser.role}
        />;

      case 'tutorials':
        return (
          <div className="p-6">
            <Tutorials />
          </div>
        );

      default: return <DashboardV2
        sales={sales}
        products={products}
        batches={batches}
        clients={clients}
        suppliers={suppliers}
        onNavigate={setActiveTab}
        currentUser={currentUser}
        saasClients={saasClients}
        bulkProducts={bulkProducts}
        settings={settings}
      />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans relative">
      {/* Modals and Overlays */}
      <SubscriptionModal isOpen={isLockedByLicense} />

      {/* GRACE PERIOD WARNING MODAL */}
      {showGraceWarning && isInGracePeriod && (
        <GraceWarningModal
          daysRemaining={graceDaysRemaining}
          onClose={() => setShowGraceWarning(false)}
          onGoToPayment={() => {
            setActiveTab('settings'); // Navigate to Settings tab where subscription is managed
          }}
        />
      )}



      <Toaster position="top-right" richColors closeButton />

      {/* Operator Lock Screen Overlay */}
      {isLocked && systemUsers.length > 0 && (
        <OperatorLockScreen
          users={systemUsers}
          onUnlock={(user) => {
            setCurrentUser(user);
            setIsLocked(false);
            toast.success(`Bienvenido, ${user.name}`);
          }}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={currentUser}
        currentSession={currentSession}
      />

      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between print:hidden">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600"><Menu /></button>
          <div className="flex items-center gap-4">
            {currentSession && currentSession.status === 'OPEN' ? (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 animate-pulse">
                CAJA ABIERTA
              </span>
            ) : (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
                CAJA CERRADA
              </span>
            )}

            {/* Lock Button - Only visible if there are other system users */}
            {systemUsers.length > 0 && (
              <button
                onClick={() => setIsLocked(true)}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                title="Bloquear Sistema (Modo Operador)"
              >
                <Lock className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-700">{currentUser?.name}</p>
                <p className="text-xs text-gray-500 uppercase">
                  {(currentUser?.role as string) === 'sysadmin' ? 'Dueño' : currentUser?.role}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>

              {/* LOGOUT BUTTON */}
              <button
                onClick={handleLogout}
                className="ml-2 p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 group shadow-sm"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto flex-1 flex flex-col">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[50vh]">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium text-gray-500">Cargando módulo...</p>
              </div>
            </div>
          }>
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
}


const App: React.FC = () => {
  // 1. PUBLIC CATALOG ROUTE CHECK
  const [catalogId, setCatalogId] = useState<string | null>(null);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [isTerms, setIsTerms] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const catId = params.get('catalog');
    if (catId) {
      setCatalogId(catId);
    }
    if (params.has('privacy')) {
      setIsPrivacy(true);
    }
    if (params.has('terms')) {
      setIsTerms(true);
    }
  }, []);

  if (catalogId) {
    return <PublicCatalog tenantId={catalogId} />;
  }

  if (isPrivacy) {
    return <PrivacyPolicy />;
  }

  if (isTerms) {
    return <TermsOfService />;
  }

  return <MainApp />;
};

export default App;
import { StateCreator } from 'zustand';
import { Sale, CashSession, CashMovement, Client } from '../../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export interface SalesSlice {
    sales: Sale[];
    sessions: CashSession[];
    currentSession: CashSession | null;
    cashMovements: CashMovement[];
    clients: Client[];
    fetchSales: () => Promise<void>;
    fetchSessions: () => Promise<void>;
    addSale: (sale: Sale) => Promise<void>;
    openSession: (session: CashSession) => Promise<void>;
    closeSession: (sessionId: string, finalCash: number, endTime: string) => Promise<void>;
    addCashMovement: (movement: CashMovement) => Promise<void>;
    addClient: (client: Client) => Promise<void>;
    seedClients: (clients: Client[]) => Promise<void>;
    updateClient: (client: Client) => void;
    updateSalePaymentMethod: (saleId: string, newPaymentMethod: string) => Promise<void>;
    deleteSale: (saleId: string) => Promise<void>;
    recoverOrphanedSales: (currentSessionId: string, salesToRecover: Sale[]) => Promise<void>;
}

export const createSalesSlice: StateCreator<SalesSlice> = (set, get) => ({
    sales: [],
    sessions: [],
    currentSession: null,
    cashMovements: [],
    clients: [],

    fetchSales: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // Fetch Sales (Optimized: Last 90 days with Pagination)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        let allSales: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        try {
            while (hasMore) {
                const from = page * pageSize;
                const to = from + pageSize - 1;

                const { data, error } = await supabase
                    .from('sales')
                    .select('*, items:sale_items(*)')
                    .eq('tenant_id', tenantId)
                    .gte('date', ninetyDaysAgo.toISOString()) // Filter by date
                    .order('date', { ascending: false })
                    .range(from, to);

                if (error) {
                    console.error('Error fetching sales page:', page, error);
                    toast.error('Error al cargar historial de ventas (Página ' + (page + 1) + ')');
                    hasMore = false; // Stop on error
                    break;
                }

                if (data) {
                    allSales = [...allSales, ...data];

                    // If we got fewer records than requested, we've reached the end
                    if (data.length < pageSize) {
                        hasMore = false;
                    } else {
                        page++;
                    }

                    // Safety break to prevent infinite loops (cap at 20 pages / 20k sales for safety)
                    if (page > 30) {
                        console.warn("Safety break: Reached 30 pages of sales.");
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            }

            const mappedSales = allSales.map((s: any) => ({
                id: s.id,
                date: s.date,
                total: s.total,
                subtotal: s.subtotal || s.total,
                surcharge: s.surcharge || 0,
                paymentMethodName: s.payment_method,
                sessionId: s.session_id || 'unknown',
                items: (s.items || []).map((i: any) => ({
                    id: i.product_id,
                    name: i.name,
                    quantity: i.quantity,
                    price: i.price,
                    cost: i.cost
                }))
            }));
            set({ sales: mappedSales });

        } catch (err) {
            console.error("Critical error in fetchSales loop:", err);
            toast.error("Error crítico al cargar ventas");
        }

        // Fetch Clients
        const { data: clients } = await supabase.from('clients').select('*').eq('tenant_id', tenantId);
        if (clients) {
            const mappedClients = clients.map((c: any) => ({
                id: c.id,
                name: c.name,
                dni: c.dni,
                phone: c.phone,
                email: c.email,
                address: c.address,
                currentAccountBalance: c.current_account_balance,
                virtualWalletBalance: c.virtual_wallet_balance
            }));
            set({ clients: mappedClients });
        }
    },

    fetchSessions: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        // const userId = state.currentUser?.id; // We want to see all sessions for the tenant, or maybe just user? Usually tenant for admin.
        // Let's filter by tenant_id only to allow seeing other employees' sessions if needed, or stick to user if strict.
        // For now, let's fetch all for tenant to ensure history is visible.

        if (!tenantId) return;

        // 1. Fetch ALL Sessions
        const { data: sessions, error } = await supabase
            .from('cash_sessions')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('start_time', { ascending: false });

        if (error) {
            console.error("Error fetching sessions:", error);
            return;
        }

        if (sessions) {
            const mappedSessions = sessions.map((s: any) => ({
                id: s.id,
                startTime: s.start_time,
                endTime: s.end_time,
                initialFloat: s.initial_float,
                finalDeclaredCash: s.final_declared_cash,
                status: s.status,
                userId: s.user_id,
                userName: 'Usuario' // We might need to fetch users to get names, or join. For now default.
            }));

            set({ sessions: mappedSessions });

            // Find Active Session (Local check)
            // We allow any open session for the tenant to be considered "current" 
            // for multi-device sync in a kiosk environment.
            const activeSession = mappedSessions.find((s: any) => s.status === 'OPEN');

            if (activeSession) {
                console.log("Active session found:", activeSession.id);
                set({ currentSession: activeSession });
            } else {
                set({ currentSession: null });
            }
        }

        // 2. Fetch ALL Movements (to support history calculation)
        const { data: movements } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('tenant_id', tenantId);

        if (movements) {
            const mappedMovements = movements.map((m: any) => ({
                id: m.id,
                date: m.date,
                type: m.type,
                amount: m.amount,
                description: m.description,
                sessionId: m.session_id
            }));
            set({ cashMovements: mappedMovements });
        }
    },

    addSale: async (sale) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        const currentSession = state.currentSession;
        const currentUser = state.currentUser;

        if (!tenantId || !currentUser) {
            toast.error('Error: No se pudo identificar el negocio o el usuario.');
            return;
        }

        const updateClient = state.updateClient;

        // ---------------------------------------------------------
        // ATOMIC TRANSACTION VIA RPC
        // ---------------------------------------------------------
        // Use client-generated ID for idempotency (passed in sale.id)

        const rpcPayload = {
            p_sale_id: sale.id,
            p_tenant_id: tenantId,
            p_user_id: currentUser.id,
            p_session_id: currentSession?.id || null, // Allow null if no session (e.g. online)
            p_client_id: sale.clientId || null,
            p_payment_method: sale.paymentMethodName,
            p_total: sale.total,
            p_subtotal: sale.subtotal,
            p_surcharge: sale.surcharge || 0,
            p_items: sale.items.map((item: any) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                cost: item.cost || 0,
                isWeighted: item.isWeighted || false
            })),
            p_is_current_account: sale.paymentMethodName === 'Cuenta Corriente',
            p_date: sale.date || new Date().toISOString()
        };

        const { data, error } = await supabase.rpc('process_sale_transaction', rpcPayload);

        if (error) {
            console.error('Error processing sale transaction:', error);
            // Handle specific triggers from RPC
            if (error.message.includes('Stock insuficiente')) {
                toast.error(error.message); // Show exact stock error
            } else if (error.message.includes('Venta ya procesada')) {
                toast.warning('Esta venta ya fue procesada.');
                // Treat as success to avoid UI freeze? Or just return.
            } else {
                toast.error('Error al procesar venta', { description: error.message });
            }
            throw new Error(error.message); // Re-throw so caller knows it failed
        }

        if (data && data.status === 'error') {
            toast.error(data.message);
            throw new Error(data.message);
        }

        // ---------------------------------------------------------
        // SUCCESS: OPTIMISTIC UPDATES
        // ---------------------------------------------------------

        // 1. Add Sale to Local State
        set((state) => ({ sales: [...state.sales, sale] }));

        // 2. Update Local Stock (Sync with DB)
        // We use the helper we added to inventorySlice
        // Assuming we can access the store instance or we have to trust the store merge.
        // In Zustand with devtools/persist, slices are merged. 
        // We can access via `get()` but TypeScript might complain if generic isn't full.
        // We act on `state` if it has the method, or use global import.

        // Using global store access pattern if possible, or `get()` which is the store.
        const store = get() as any;
        if (store.deductLocalStock) {
            store.deductLocalStock(sale.items.map((i: any) => ({
                id: i.id,
                quantity: i.quantity,
                isWeighted: i.isWeighted || false
            })));
        }

        // 3. Update Client Balance (if applicable)
        if (sale.paymentMethodName === 'Cuenta Corriente' && sale.clientId) {
            const client = state.clients.find((c: any) => c.id === sale.clientId);
            if (client) {
                const newBalance = (client.currentAccountBalance || 0) + sale.total;
                updateClient({ ...client, currentAccountBalance: newBalance });
            }
        }

        toast.success('Venta registrada correctamente');
    },

    openSession: async (session) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) {
            toast.error('Error: No se pudo identificar el negocio.');
            return;
        }

        const { error } = await supabase.from('cash_sessions').insert([{
            id: session.id,
            tenant_id: tenantId,
            user_id: session.userId,
            start_time: session.startTime,
            initial_float: session.initialFloat,
            status: 'OPEN',
            user_name: session.userName // Ensure user_name is sent as required by schema
        }]);

        if (error) {
            console.error('Error opening session:', error);
            toast.error('Error al abrir caja', { description: error.message });
            return;
        }

        // Only update local state if DB insert was successful
        set((state) => ({
            sessions: [session, ...state.sessions],
            currentSession: session
        }));

        toast.success('Caja abierta correctamente');
    },

    closeSession: async (sessionId, finalCash, endTime) => {
        const { error } = await supabase.from('cash_sessions').update({
            status: 'CLOSED',
            final_declared_cash: finalCash,
            end_time: endTime
        })
            .eq('id', sessionId)
            .select();

        if (error) {
            console.error('Error closing session:', error);
            toast.error('Hubo un error al cerrar la caja. Por favor intente nuevamente.', { description: error.message });
        } else {
            // Update local state ONLY after DB success
            set((state) => {
                const closedSession = state.currentSession ? { ...state.currentSession, status: 'CLOSED' as const, finalDeclaredCash: finalCash, endTime } : null;
                return {
                    currentSession: null,
                    sessions: state.sessions.map(s => s.id === sessionId && closedSession ? closedSession : s)
                };
            });
            toast.success('Caja cerrada correctamente. ¡Buen trabajo! 👏');
        }
    },

    addCashMovement: async (movement) => {
        set((state) => ({ cashMovements: [...state.cashMovements, movement] }));

        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const { error } = await supabase.from('cash_movements').insert([{
            id: movement.id,
            tenant_id: tenantId,
            session_id: movement.sessionId,
            type: movement.type,
            amount: movement.amount,
            description: movement.description,
            date: movement.date
        }]);
        if (error) console.error('Error adding movement:', error);
    },

    addClient: async (client) => {
        // ... (keep current implementation but I'll replace the block to insert seedClients after)
        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        console.log("DEBUG: Adding client...", { client, tenantId, currentUser: state.currentUser?.id });

        if (!tenantId) {
            console.error("CRITICAL: No tenantId found when adding client!");
            toast.error("Error interno: No se identificó el negocio (Tenant ID missing).");
            return;
        }

        // Optimistic Update
        set((state) => ({ clients: [...state.clients, client] }));

        // map camelCase to snake_case for DB
        const dbClient = {
            id: client.id,
            name: client.name,
            dni: client.dni,
            phone: client.phone,
            email: client.email,
            address: client.address,
            current_account_balance: client.currentAccountBalance,
            virtual_wallet_balance: client.virtualWalletBalance,
            tenant_id: tenantId
        };

        const { data, error } = await supabase.from('clients').insert([dbClient]).select();

        if (error) {
            console.error('Error adding client to DB:', error);
            toast.error('Error al guardar en base de datos', { description: error.message });
        } else {
            console.log("DEBUG: Client added successfully to DB:", data);
        }
    },

    seedClients: async (clients) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbClients = clients.map(client => ({
            id: client.id,
            name: client.name,
            dni: client.dni,
            phone: client.phone,
            email: client.email,
            address: client.address,
            current_account_balance: client.currentAccountBalance,
            virtual_wallet_balance: client.virtualWalletBalance,
            tenant_id: tenantId
        }));

        const { error } = await supabase.from('clients').upsert(dbClients);
        if (error) console.error('Error seeding clients:', error);
    },

    updateClient: async (client) => { // Made async to handle DB update here if needed, or keep sync?
        // Note: The original code had updateClient as sync but the slice definition had it as void.
        // Usually updateClient just updates local state in this slice, but typically we want to persist.
        // However, 'updateClient' in the slice interface is defined as `(client: Client) => void`. 
        // If we want to persist, we should probably do it in the Component or here.
        // In Clients.tsx, we saw explicit supabase.update call.
        // So this function is likely just for local state update.
        // But wait, the previous `updateClient` implementation was:
        /*
            updateClient: (client) => set((state) => ({
                clients: state.clients.map((c) => (c.id === client.id ? client : c)),
            })),
        */
        // So I will just keep it simple but since I am editing the file, I'll ensure it stays correct.
        // The cursor is at addClient. The request was about 'currentAccountBalance' column error, likely in addClient.
        // I'll only fix addClient here to be safe and precise.
        set((state) => ({
            clients: state.clients.map((c) => (c.id === client.id ? client : c)),
        }));
    },

    updateSalePaymentMethod: async (saleId, newPaymentMethod) => {
        set((state) => ({
            sales: state.sales.map((s) =>
                s.id === saleId ? { ...s, paymentMethodName: newPaymentMethod } : s
            )
        }));

        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        const { error } = await supabase
            .from('sales')
            .update({ payment_method: newPaymentMethod })
            .eq('id', saleId)
            .eq('tenant_id', tenantId || '');

        if (error) {
            console.error('Error updating payment method:', error);
            toast.error('Error al actualizar medio de pago');
        } else {
            toast.success('Medio de pago actualizado');
        }
    },

    deleteSale: async (saleId) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const sale = state.sales.find((s: any) => s.id === saleId);
        if (!sale) {
            toast.error('Venta no encontrada');
            return;
        }

        // 1. Optimistic Update
        set((state) => ({
            sales: (state.sales || []).filter((s) => s.id !== saleId)
        }));

        // 2. Restore Stock Logic
        // We need access to inventory batches and bulk products. 
        // Since we are in a slice, we can access the whole store via get() if it was merged, 
        // but here 'state' inside createSalesSlice mainly refers to SalesSlice part if using TypeScript strictness, 
        // or the whole store if using the middleware. 
        // 'get()' returns the full store state.

        const batches = state.batches || [];
        const bulkProducts = state.bulkProducts || [];
        const items = sale.items || [];

        // Prepare DB updates
        // We will perform them sequentially for safety, or we could optimize.

        for (const item of items) {
            if (item.quantity <= 0) continue;

            if (item.name.includes('(Granel)') || item.name.includes('Kg)')) {
                // It's likely a bulk product, but better check if we can find it in bulkProducts by ID
                // In POS, we used item.id as product.id.
                const bulkProd = bulkProducts.find((p: any) => p.id === item.id);
                if (bulkProd) {
                    // Restore Bulk Stock
                    const newStock = bulkProd.stockKg + item.quantity;
                    // Update DB
                    await supabase.from('bulk_products')
                        .update({ stock_kg: newStock })
                        .eq('id', bulkProd.id)
                        .eq('tenant_id', tenantId);

                    // Update Local State (Inventory Slice)
                    // We can't easily set another slice's state from here without using the globally set function 
                    // or assuming this slice has access. 
                    // UseStore.getState().updateBulkProduct(...) might work if we interpret this as outside.
                    // But 'set' here only sets SalesSlice.
                    // We will rely on fetching or acceptable delay, or we can try to call the action if available.
                    // Check if 'updateBulkProduct' is available in 'state' (it is merged store).
                    if (state.updateBulkProduct) {
                        state.updateBulkProduct({ ...bulkProd, stockKg: newStock });
                    }
                }
            } else {
                // Regular Product - Restore to Batch
                // Strategy: Find any batch for this product and add quantity. 
                // Ideally the one with latest expiry or just the first one.
                const productBatches = (batches || []).filter((b: any) => b.productId === item.id);
                if (productBatches.length > 0) {
                    // Pick the last one added or just the first one found.
                    const targetBatch = productBatches[0];
                    const newQuantity = targetBatch.quantity + item.quantity;

                    // Update DB
                    await supabase.from('inventory_batches')
                        .update({ quantity: newQuantity })
                        .eq('id', targetBatch.id)
                        .eq('tenant_id', tenantId);

                    // Update Local State
                    if (state.updateBatches) {
                        state.updateBatches([{ ...targetBatch, quantity: newQuantity }]);
                    }
                }
            }
        }

        // 3. Delete from DB
        const { error } = await supabase.from('sales').delete().eq('id', saleId);

        if (error) {
            console.error('Error deleting sale:', error);
            toast.error('Error al eliminar venta de la base de datos');
            // Optimization: Revert optimistic update?
        } else {
            toast.success('Venta eliminada y stock restaurado');
        }
    },

    recoverOrphanedSales: async (currentSessionId, salesToRecover) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        if (salesToRecover.length === 0) {
            toast.info("No hay ventas para recuperar");
            return;
        }

        const saleIds = salesToRecover.map(s => s.id);

        // 1. Update Supabase
        const { error } = await supabase
            .from('sales')
            .update({ session_id: currentSessionId })
            .in('id', saleIds)
            .eq('tenant_id', tenantId);

        if (error) {
            console.error("Error recovering sales:", error);
            toast.error("Error al recuperar ventas", { description: error.message });
            return;
        }

        // 2. Update Local State
        set((state) => ({
            sales: state.sales.map((s) =>
                saleIds.includes(s.id) ? { ...s, sessionId: currentSessionId } : s
            )
        }));

        toast.success(`Se vincularon ${salesToRecover.length} ventas a la caja actual`);
    }
});

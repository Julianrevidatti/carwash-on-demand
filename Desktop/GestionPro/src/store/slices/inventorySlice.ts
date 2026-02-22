import { StateCreator } from 'zustand';
import { Product, InventoryBatch, Supplier } from '../../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export interface InventorySlice {
    products: Product[];
    batches: InventoryBatch[];
    suppliers: Supplier[];
    fetchProducts: () => Promise<void>;
    addProduct: (product: Product) => Promise<void>;
    updateProduct: (product: Product) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;
    addBatch: (batch: InventoryBatch) => Promise<void>;
    addBatches: (batches: InventoryBatch[]) => void;
    updateBatch: (batch: InventoryBatch) => Promise<void>;
    updateBatches: (batches: InventoryBatch[]) => Promise<boolean>;
    setBatches: (batches: InventoryBatch[]) => void;
    addSupplier: (supplier: Supplier) => Promise<void>;
    updateSupplier: (supplier: Supplier) => Promise<void>;
    deleteSupplier: (supplierId: string) => Promise<void>;
    transferProducts: (fromSupplierId: string, toSupplierId: string) => Promise<void>;
    addProducts: (products: Product[]) => void;
    seedProducts: (products: Product[]) => Promise<void>;
    seedBatches: (batches: InventoryBatch[]) => Promise<void>;
    seedSuppliers: (suppliers: Supplier[]) => Promise<void>;
    massUpdatePrices: (supplierId: string, percent: number) => Promise<void>;
    stockMovements: any[]; // StockMovement[]
    addStockMovement: (movement: any) => Promise<void>;
    fetchStockMovements: () => Promise<void>;
    // Bulk Products
    bulkProducts: any[]; // BulkProduct[]
    addBulkProduct: (product: any) => Promise<void>;
    updateBulkProduct: (product: any) => Promise<void>;
    deleteBulkProduct: (id: string) => Promise<void>;
    deductBulkStock: (items: { id: string, quantity: number, name?: string, saleId?: string }[]) => Promise<void>;
    // DB-first stock exit (keep for manual exit)
    exitBatchStock: (productId: string, quantity: number, reason: string, productName: string) => Promise<boolean>;
    // DEPRECATED: Legacy client-side sales logic
    processSaleStock: (saleId: string, items: { id: string, name: string, quantity: number }[]) => Promise<boolean>;
    // NEW: Sync local state after RPC transaction
    deductLocalStock: (items: { id: string, quantity: number, isWeighted: boolean }[]) => void;
}

export const createInventorySlice: StateCreator<InventorySlice> = (set, get) => ({
    products: [],
    batches: [],
    suppliers: [],
    stockMovements: [],
    bulkProducts: [],

    // FETCH ACTIONS
    fetchProducts: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // 1. Fetch Regular Products
        const { data, error } = await supabase.from('products').select('*').eq('tenant_id', tenantId);
        if (error) {
            console.error('Error fetching products:', error);
            toast.error('Error al cargar productos');
        } else if (data) {
            const mappedProducts = data.map((p: any) => ({
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                cost: p.cost,
                profitMargin: p.profit_margin,
                price: p.price,
                supplierId: p.supplier_id,
                isPack: p.is_pack,
                childProductId: p.child_product_id,
                childQuantity: p.child_quantity,
                isManualPrice: p.is_manual_price || false,
                image_url: p.image_url // MAP IMAGE URL
            }));
            set({ products: mappedProducts });
        }

        // 2. Fetch Bulk Products
        const { data: bulkData, error: bulkError } = await supabase.from('bulk_products').select('*').eq('tenant_id', tenantId);
        if (bulkError) {
            console.error('Error fetching bulk products:', bulkError);
        } else if (bulkData) {
            const mappedBulk = bulkData.map((p: any) => ({
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                supplierId: p.supplier_id,
                costPerBulk: p.cost_per_bulk,
                weightPerBulk: p.weight_per_bulk,
                pricePerKg: p.price_per_kg,
                stockKg: p.stock_kg
            }));
            set({ bulkProducts: mappedBulk });
        }

        // Also fetch related data
        const { data: suppliers } = await supabase.from('suppliers').select('*').eq('tenant_id', tenantId);
        if (suppliers) {
            const mappedSuppliers = suppliers.map((s: any) => ({
                id: s.id,
                name: s.name,
                contactInfo: s.contact_info,
                visitFrequency: s.visit_frequency
            }));
            set({ suppliers: mappedSuppliers });
        }

        const { data: batches } = await supabase.from('inventory_batches').select('*').eq('tenant_id', tenantId);
        if (batches) {
            const mappedBatches = batches.map((b: any) => ({
                id: b.id,
                productId: b.product_id,
                batchNumber: b.batch_number,
                quantity: b.quantity,
                originalQuantity: b.original_quantity, // Load original quantity
                expiryDate: b.expiry_date,
                dateAdded: b.date_added
            }));
            set({ batches: mappedBatches });
        }

        // Fetch Stock Movements
        get().fetchStockMovements();
    },

    fetchStockMovements: async () => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // Manual Pagination Loop to bypass Supabase 1000-row limit
        const MAX_RECORDS = 3000;
        const CHUNK_SIZE = 1000;
        let allMovements: any[] = [];
        let hasMore = true;
        let page = 0;

        while (hasMore && allMovements.length < MAX_RECORDS) {
            // Calculate range for this chunk
            const from = page * CHUNK_SIZE;
            const to = from + CHUNK_SIZE - 1;

            const { data, error } = await supabase
                .from('stock_movements')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('date', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error fetching stock movements page', page, error);
                hasMore = false;
            } else if (data) {
                allMovements = [...allMovements, ...data];

                // If we got fewer records than requested, we reached the end
                if (data.length < CHUNK_SIZE) {
                    hasMore = false;
                }

                page++;
            } else {
                hasMore = false;
            }
        }

        const mappedMovements = allMovements.map((m: any) => ({
            id: m.id,
            date: m.date,
            productId: m.product_id,
            productName: m.product_name,
            quantity: m.quantity,
            detail: m.detail, // Ensure detail is mapped
            reason: m.reason,
            type: m.type,
            userId: m.user_id
        }));

        set({ stockMovements: mappedMovements });
    },

    addStockMovement: async (movement) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) {
            console.error('No tenant ID available for stock movement');
            return;
        }

        // DB-FIRST: Insert to database before updating local state
        const dbMovement = {
            id: movement.id,
            date: movement.date,
            product_id: movement.productId,
            product_name: movement.productName,
            quantity: movement.quantity,
            reason: movement.reason,
            detail: movement.detail, // FIX: Include detail field
            type: movement.type,
            user_id: movement.userId,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('stock_movements').insert([dbMovement]);

        if (error) {
            console.error('Error adding stock movement:', error);
            toast.error('Error al registrar movimiento');
            return; // Don't update local state if DB insert failed
        }

        // Only update local state if DB insert was successful
        set((state) => ({ stockMovements: [movement, ...state.stockMovements] }));
    },

    // CRUD ACTIONS
    addProduct: async (product) => {
        set((state) => ({ products: [...state.products, product] }));

        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        if (!tenantId) {
            console.error("Missing Tenant ID");
            toast.error("Error crítico: No hay un negocio seleccionado.", {
                description: "Por favor recarga la página o contacta soporte."
            });
            return;
        }

        console.log("Saving product for tenant:", tenantId, product);

        // Map Frontend camelCase to DB snake_case
        const dbProduct = {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            cost: product.cost,
            profit_margin: product.profitMargin,
            price: product.price,
            supplier_id: product.supplierId || null,
            is_pack: product.isPack,
            child_product_id: product.childProductId || null,
            child_quantity: product.childQuantity || null,
            is_manual_price: product.isManualPrice || false,
            image_url: product.image_url, // SAVE IMAGE URL
            tenant_id: tenantId
        };

        const { error } = await supabase.from('products').insert([dbProduct]);

        if (error) {
            console.error('Error adding product:', error);
            toast.error('Error al guardar producto', {
                description: `Detalle: ${error.message} (Code: ${error.code})`
            });
        } else {
            toast.success('Producto guardado correctamente');
        }
    },

    updateProduct: async (product) => {
        set((state) => ({
            products: state.products.map((p) => (p.id === product.id ? product : p)),
        }));

        const dbProduct = {
            name: product.name,
            barcode: product.barcode,
            cost: product.cost,
            profit_margin: product.profitMargin,
            price: product.price,
            supplier_id: product.supplierId || null,
            is_pack: product.isPack,
            child_product_id: product.childProductId || null,
            child_quantity: product.childQuantity || null,
            is_manual_price: product.isManualPrice || false,
            image_url: product.image_url // UPDATE IMAGE URL
        };

        const { error } = await supabase.from('products').update(dbProduct).eq('id', product.id);
        if (error) {
            console.error('Error updating product:', error);
            toast.error('Error al actualizar producto');
        } else {
            toast.success('Producto actualizado');
        }
    },

    deleteProduct: async (productId) => {
        set((state) => ({
            products: (state.products || []).filter((p) => p.id !== productId),
        }));
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) {
            console.error('Error deleting product:', error);
            toast.error('Error al eliminar producto');
        } else {
            toast.success('Producto eliminado');
        }
    },

    addBatch: async (batch) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) {
            toast.error('Error: No se encontró la sesión del usuario');
            return;
        }

        const dbBatch = {
            id: batch.id,
            product_id: batch.productId,
            batch_number: batch.batchNumber,
            quantity: batch.quantity,
            original_quantity: batch.originalQuantity || batch.quantity, // Save original quantity
            expiry_date: batch.expiryDate,
            date_added: batch.dateAdded,
            tenant_id: tenantId
        };

        // DB-FIRST: Insert into database first
        const { error } = await supabase.from('inventory_batches').insert([dbBatch]);

        if (error) {
            console.error('Error adding batch:', error);
            toast.error('Error al guardar lote en la base de datos', {
                description: `Detalle: ${error.message}`
            });
            return; // Stop here, do not update local state
        }

        // Update local state ONLY after successful DB insert
        set((state) => ({ batches: [...state.batches, batch] }));
        toast.success('Lote guardado correctamente');
    },

    addBatches: (newBatches) => set((state) => ({ batches: [...state.batches, ...newBatches] })),

    updateBatch: async (batch) => {
        set((state) => ({
            batches: state.batches.map((b) => (b.id === batch.id ? batch : b)),
        }));

        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbBatch = {
            product_id: batch.productId,
            batch_number: batch.batchNumber,
            quantity: batch.quantity,
            expiry_date: batch.expiryDate,
            date_added: batch.dateAdded,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('inventory_batches').update(dbBatch).eq('id', batch.id);
        if (error) console.error('Error updating batch:', error);
    },

    setBatches: (batches) => set({ batches }),

    // New action for bulk updates (e.g. after sale)
    updateBatches: async (updatedBatches) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) {
            console.error('No tenant ID available for batch update');
            return false;
        }

        // DB-FIRST APPROACH: Update database before local state
        // This prevents UI/DB desynchronization if DB operation fails
        const dbBatches = updatedBatches.map(b => ({
            id: b.id,
            product_id: b.productId,
            batch_number: b.batchNumber,
            quantity: b.quantity,
            expiry_date: b.expiryDate,
            date_added: b.dateAdded,
            tenant_id: tenantId
        }));

        const { error } = await supabase.from('inventory_batches').upsert(dbBatches);

        if (error) {
            console.error('Error updating batches in database:', error);
            toast.error('Error al actualizar stock en la base de datos');
            return false; // Don't update local state if DB operation failed
        }

        // Only update local state if DB update was successful
        set((state) => {
            const newBatches = [...state.batches];
            updatedBatches.forEach(updated => {
                const index = newBatches.findIndex(b => b.id === updated.id);
                if (index !== -1) newBatches[index] = updated;
            });
            return { batches: newBatches };
        });
        return true;
    },

    addProducts: (newProducts) => set((state) => ({ products: [...state.products, ...newProducts] })),

    seedProducts: async (products) => {
        set((state) => ({ products: [...state.products, ...products] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            barcode: p.barcode,
            cost: p.cost,
            profit_margin: p.profitMargin,
            price: p.price,
            supplier_id: p.supplierId || null,
            is_pack: p.isPack,
            child_product_id: p.childProductId || null,
            child_quantity: p.childQuantity || null,
            is_manual_price: p.isManualPrice || false,
            image_url: p.image_url,
            tenant_id: tenantId
        }));

        const { error } = await supabase.from('products').upsert(dbProducts);
        if (error) console.error('Error seeding products:', error);
    },

    seedBatches: async (batches) => {
        set((state) => ({ batches: [...state.batches, ...batches] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbBatches = batches.map(b => ({
            id: b.id,
            product_id: b.productId,
            batch_number: b.batchNumber,
            quantity: b.quantity,
            original_quantity: b.originalQuantity || b.quantity,
            expiry_date: b.expiryDate,
            date_added: b.dateAdded,
            tenant_id: tenantId
        }));

        const { error } = await supabase.from('inventory_batches').upsert(dbBatches);
        if (error) console.error('Error seeding batches:', error);
    },

    seedSuppliers: async (suppliers) => {
        set((state) => ({ suppliers: [...state.suppliers, ...suppliers] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbSuppliers = suppliers.map(s => ({
            id: s.id,
            name: s.name,
            contact_info: s.contactInfo,
            visit_frequency: s.visitFrequency,
            tenant_id: tenantId
        }));

        const { error } = await supabase.from('suppliers').upsert(dbSuppliers);
        if (error) console.error('Error seeding suppliers:', error);
    },

    addSupplier: async (supplier) => {
        set((state) => ({ suppliers: [...state.suppliers, supplier] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbSupplier = {
            id: supplier.id,
            name: supplier.name,
            contact_info: supplier.contactInfo,
            visit_frequency: supplier.visitFrequency,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('suppliers').insert([dbSupplier]);
        if (error) {
            console.error('Error adding supplier:', error);
            toast.error('Error al guardar proveedor', {
                description: `Detalle: ${error.message}`
            });
        } else {
            toast.success('Proveedor guardado');
        }
    },

    updateSupplier: async (supplier) => {
        set((state) => ({
            suppliers: state.suppliers.map((s) => (s.id === supplier.id ? supplier : s)),
        }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const dbSupplier = {
            name: supplier.name,
            contact_info: supplier.contactInfo,
            visit_frequency: supplier.visitFrequency,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('suppliers').update(dbSupplier).eq('id', supplier.id);
        if (error) {
            console.error('Error updating supplier:', error);
            toast.error('Error al actualizar proveedor');
        } else {
            toast.success('Proveedor actualizado');
        }
    },

    deleteSupplier: async (supplierId) => {
        set((state) => ({
            suppliers: (state.suppliers || []).filter((s) => s.id !== supplierId),
        }));
        const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
        if (error) {
            console.error('Error deleting supplier:', error);
            toast.error('Error al eliminar proveedor. Verifique que no tenga productos asociados.');
            // Revert optimistic update if necessary, but for now simple
        } else {
            toast.success('Proveedor eliminado');
        }
    },

    transferProducts: async (fromSupplierId, toSupplierId) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        // 1. Optimistic Update (State)
        set((state) => ({
            products: state.products.map(p => p.supplierId === fromSupplierId ? { ...p, supplierId: toSupplierId } : p),
            bulkProducts: state.bulkProducts.map(p => p.supplierId === fromSupplierId ? { ...p, supplierId: toSupplierId } : p)
        }));

        // 2. DB Update - Products
        const { error: errorProd } = await supabase
            .from('products')
            .update({ supplier_id: toSupplierId })
            .eq('supplier_id', fromSupplierId)
            .eq('tenant_id', tenantId);

        // 3. DB Update - Bulk Products
        const { error: errorBulk } = await supabase
            .from('bulk_products')
            .update({ supplier_id: toSupplierId })
            .eq('supplier_id', fromSupplierId)
            .eq('tenant_id', tenantId);

        if (errorProd || errorBulk) {
            console.error('Error transferring products:', errorProd, errorBulk);
            toast.error('Hubo un error al transferir algunos productos.');
        } else {
            toast.success('Productos transferidos exitosamente');
        }
    },

    massUpdatePrices: async (supplierId, percent) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) return;

        const factor = 1 + percent / 100;
        const updatedProducts: Product[] = [];

        // 1. Update State - Skip products with manual price
        set((state) => {
            const newProducts = state.products.map((p) => {
                if (p.supplierId === supplierId && !p.isManualPrice) {
                    const updated = {
                        ...p,
                        cost: Math.ceil(p.cost * factor),
                        price: Math.ceil(p.price * factor),
                    };
                    updatedProducts.push(updated);
                    return updated;
                }
                return p;
            });
            return { products: newProducts };
        });

        // 2. Update DB
        // We can't easily do a bulk update with different values in one query unless we use a specific RPC or multiple updates.
        // For mass update by percentage, we can use an RPC or loop.
        // Since we don't have an RPC for this, we'll loop for now (or use Promise.all).
        // Optimization: If we had an RPC `apply_price_increase(supplier_id, factor)`, it would be better.
        // But let's stick to client-side loop for MVP simplicity, or better, use `upsert` if we can map all fields.

        // Actually, we can use `upsert` for the modified products.
        if (updatedProducts.length > 0) {
            const dbProducts = updatedProducts.map(p => ({
                id: p.id,
                name: p.name,
                barcode: p.barcode,
                cost: p.cost,
                profit_margin: p.profitMargin,
                price: p.price,
                supplier_id: p.supplierId || null,
                is_pack: p.isPack,
                child_product_id: p.childProductId || null,
                child_quantity: p.childQuantity || null,
                tenant_id: tenantId
            }));

            const { error } = await supabase.from('products').upsert(dbProducts);
            if (error) {
                console.error('Error mass updating prices:', error);
                toast.error('Error al guardar precios actualizados');
            } else {
                toast.success('Precios actualizados en base de datos');
            }
        }
    },

    // BULK PRODUCTS CRUD
    addBulkProduct: async (product) => {
        set((state) => ({ bulkProducts: [...state.bulkProducts, product] }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        if (!tenantId) {
            console.error("Missing Tenant ID for bulk product");
            toast.error("Error: No hay sesión activa para guardar.");
            return;
        }

        const dbProduct = {
            id: product.id,
            name: product.name,
            barcode: product.barcode,
            supplier_id: product.supplierId || null,
            cost_per_bulk: product.costPerBulk,
            weight_per_bulk: product.weightPerBulk,
            price_per_kg: product.pricePerKg,
            stock_kg: product.stockKg,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('bulk_products').insert([dbProduct]);
        if (error) {
            console.error('Error adding bulk product:', error);
            toast.error('Error al guardar producto a granel');
        } else {
            toast.success('Producto a granel guardado');
        }
    },

    updateBulkProduct: async (product) => {
        set((state) => ({
            bulkProducts: state.bulkProducts.map((p) => (p.id === product.id ? product : p)),
        }));
        const state = get() as any;
        const tenantId = state.currentTenant?.id;

        if (!tenantId) {
            console.error("Missing Tenant ID for bulk update");
            toast.error("Error: No hay sesión activa para actualizar.");
            return;
        }

        const dbProduct = {
            name: product.name,
            barcode: product.barcode,
            supplier_id: product.supplierId || null,
            cost_per_bulk: product.costPerBulk,
            weight_per_bulk: product.weightPerBulk,
            price_per_kg: product.pricePerKg,
            stock_kg: product.stockKg,
            tenant_id: tenantId
        };

        const { error } = await supabase.from('bulk_products').update(dbProduct).eq('id', product.id);
        if (error) {
            console.error('Error updating bulk product:', error);
            toast.error('Error al actualizar producto a granel');
        } else {
            toast.success('Producto a granel actualizado');
        }
    },

    deleteBulkProduct: async (id) => {
        set((state) => ({
            bulkProducts: (state.bulkProducts || []).filter((p) => p.id !== id),
        }));

        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        if (!tenantId) {
            console.error("Missing Tenant ID for bulk delete");
            return;
        }

        const { error } = await supabase.from('bulk_products').delete().eq('id', id);
        if (error) {
            console.error('Error deleting bulk product:', error);
            toast.error('Error al eliminar producto a granel');
        } else {
            toast.success('Producto a granel eliminado');
        }
    },

    deductBulkStock: async (items) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        const currentUser = state.currentUser;
        if (!tenantId) return;

        console.log("Deducting bulk stock for items:", items);

        for (const item of items) {
            // 1. Fetch FRESH stock from DB to ensure accuracy
            const { data: currentProd, error: fetchError } = await supabase
                .from('bulk_products')
                .select('stock_kg, name')
                .eq('id', item.id)
                .single();

            if (fetchError || !currentProd) {
                console.error(`Error fetching fresh stock for bulk product ${item.id}:`, fetchError);
                continue;
            }

            const currentStock = currentProd.stock_kg;
            const newStock = Math.max(0, currentStock - item.quantity);

            console.log(`Updating bulk ${item.id}: ${currentStock} - ${item.quantity} = ${newStock}`);

            // 2. Update DB
            const { error: updateError } = await supabase
                .from('bulk_products')
                .update({ stock_kg: newStock })
                .eq('id', item.id);

            if (updateError) {
                console.error(`Error updating bulk stock for ${item.id}:`, updateError);
                toast.error(`Error al descontar stock de granel`);
            } else {
                // 3. Update Local State (only after DB success)
                set((state) => ({
                    bulkProducts: state.bulkProducts.map((p) =>
                        p.id === item.id ? { ...p, stockKg: newStock } : p
                    )
                }));

                // 4. Register stock movement for traceability (if from sale)
                if (item.saleId) {
                    const movement = {
                        id: crypto.randomUUID(),
                        date: new Date().toISOString(),
                        productId: item.id,
                        productName: item.name || currentProd.name,
                        quantity: item.quantity,
                        reason: 'Venta (Granel)',
                        detail: `Venta #${item.saleId.slice(0, 8)}`,
                        type: 'OUT' as const,
                        userId: currentUser?.id || 'unknown'
                    };

                    const { error: movError } = await supabase
                        .from('stock_movements')
                        .insert([{
                            id: movement.id,
                            tenant_id: tenantId,
                            date: movement.date,
                            product_id: movement.productId,
                            product_name: movement.productName,
                            quantity: movement.quantity,
                            reason: movement.reason,
                            detail: movement.detail,
                            type: movement.type,
                            user_id: movement.userId
                        }]);

                    if (!movError) {
                        // Also update local movements state
                        set((state) => ({
                            stockMovements: [movement, ...state.stockMovements]
                        }));
                    }
                }
            }
        }
    },

    // DB-FIRST Stock Exit to prevent race conditions
    // This fetches fresh batch data from the database before calculating deductions
    exitBatchStock: async (productId, quantity, reason, productName) => {
        const state = get() as any;
        const tenantId = state.currentTenant?.id;
        const currentUser = state.currentUser;

        if (!tenantId) {
            console.error('No tenant ID available for stock exit');
            toast.error('Error: No hay sesión activa');
            return false;
        }

        // 1. Fetch FRESH batch data from DB to prevent race conditions
        const { data: freshBatches, error: fetchError } = await supabase
            .from('inventory_batches')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('product_id', productId)
            .gt('quantity', 0)
            .order('expiry_date', { ascending: true });

        if (fetchError) {
            console.error('Error fetching fresh batches:', fetchError);
            toast.error('Error al consultar stock');
            return false;
        }

        if (!freshBatches || freshBatches.length === 0) {
            toast.error('No hay stock disponible para este producto');
            return false;
        }

        // Map DB format to local format
        const productBatches = freshBatches.map((b: any) => ({
            id: b.id,
            productId: b.product_id,
            batchNumber: b.batch_number,
            quantity: b.quantity,
            originalQuantity: b.original_quantity,
            expiryDate: b.expiry_date,
            dateAdded: b.date_added
        }));

        // 2. Check total stock
        const totalStock = productBatches.reduce((acc: number, b: any) => acc + b.quantity, 0);
        if (totalStock < quantity) {
            toast.error(`Stock insuficiente. Disponible: ${totalStock}`);
            return false;
        }

        // 3. Calculate FIFO deductions
        let remaining = quantity;
        const batchesToUpdate: any[] = [];

        for (const batch of productBatches) {
            if (remaining <= 0) break;
            const take = Math.min(batch.quantity, remaining);
            batchesToUpdate.push({ ...batch, quantity: batch.quantity - take });
            remaining -= take;
        }

        // 4. Update DB first (DB-FIRST approach)
        const dbBatches = batchesToUpdate.map(b => ({
            id: b.id,
            product_id: b.productId,
            batch_number: b.batchNumber,
            quantity: b.quantity,
            original_quantity: b.originalQuantity,
            expiry_date: b.expiryDate,
            date_added: b.dateAdded,
            tenant_id: tenantId
        }));

        const { error: updateError } = await supabase
            .from('inventory_batches')
            .upsert(dbBatches);

        if (updateError) {
            console.error('Error updating batches:', updateError);
            toast.error('Error al actualizar stock');
            return false;
        }

        // 5. Update local state only after DB success
        set((currentState) => {
            const updatedBatches = currentState.batches.map(b => {
                const updated = batchesToUpdate.find(u => u.id === b.id);
                return updated || b;
            });
            return { batches: updatedBatches };
        });

        // 6. Register stock movement for traceability
        const movement = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            productId: productId,
            productName: productName,
            quantity: quantity,
            reason: reason,
            detail: reason,
            type: 'OUT' as const,
            userId: currentUser?.id || 'unknown'
        };

        // We already did DB update, now we just log movement
        // We use addStockMovement action which handles DB inserting for movement
        await get().addStockMovement(movement);

        toast.success('Egreso registrado correctamente');
        return true;
    },

    processSaleStock: async (saleId, items) => {
        console.warn("Using LEGACY stock process. This is vulnerable to race conditions.");
        return false;
    },

    deductLocalStock: (items) => {
        set((state) => {
            // Deep copy to avoid mutation issues
            let newBatches = state.batches.map(b => ({ ...b }));
            let newBulk = state.bulkProducts.map(b => ({ ...b }));

            items.forEach(item => {
                if (item.isWeighted) {
                    // Bulk Product
                    const index = newBulk.findIndex(b => b.id === item.id);
                    if (index !== -1) {
                        newBulk[index].stockKg = Math.max(0, newBulk[index].stockKg - item.quantity);
                    }
                } else {
                    // Regular Product (FIFO approximation for UI)
                    const productBatches = newBatches
                        .filter(b => b.productId === item.id && b.quantity > 0)
                        .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

                    let remaining = item.quantity;
                    for (const batch of productBatches) {
                        if (remaining <= 0) break;
                        const take = Math.min(batch.quantity, remaining);
                        batch.quantity -= take;
                        remaining -= take;
                    }
                }
            });

            return {
                batches: newBatches,
                bulkProducts: newBulk
            };
        });
    }
});

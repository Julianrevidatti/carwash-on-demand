import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://qeltuiqarfhymbhkdyan.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbHR1aXFhcmZoeW1iaGtkeWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTYwNDIsImV4cCI6MjA3OTk3MjA0Mn0.WkLkdaA-vIXj-JH3D3SS-UBYDt0iCo4_wzetsqyR3IU"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function run() {
    const { data: sessions, error: sessionErr } = await supabase
        .from('cash_sessions')
        .select('*')

    if (sessionErr) throw sessionErr
    const session = sessions.find(s => s.id.startsWith('4d4f4776'))
    if (!session) {
        console.log("Session not found")
        return
    }
    console.log(`Session: ${session.id}, Total Vendido:`, session.totalRevenue)

    const { data: sales, error: salesErr } = await supabase
        .from('sales')
        .select('*, items:sale_items(*)')
        .eq('session_id', session.id)

    if (salesErr) throw salesErr

    const { data: promotions, error: promoErr } = await supabase.from('promotions').select('*')
    const { data: products, error: prodErr } = await supabase.from('products').select('*')
    const { data: suppliers, error: supErr } = await supabase.from('suppliers').select('*')

    console.log(`Loaded ${sales.length} sales, ${promotions.length} promos, ${products.length} products, ${suppliers.length} suppliers`)

    const isSupplierItem = (item, supplierFilter) => {
        if (item.supplierId === supplierFilter) return true;
        const p = products.find(x => x.id === (item.product_id || item.id));
        if (p && p.supplier_id === supplierFilter) return true;
        return false;
    }

    let sCost = 0;
    let sVentaBruta = 0;
    let sTotalDiscount = 0;

    // We know TREGAR BCO's uuid. Let's find it.
    const tregarDb = suppliers.find(s => s.name.toLowerCase().includes('tregar'));
    const supplierFilter = tregarDb.id;

    for (const sale of sales) {
        let items = []
        try {
            items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
            items = items || []
        } catch (e) { continue }

        const ticketGross = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const ticketNet = sale.total - (sale.surcharge || 0);
        const ticketDiscount = Math.max(0, ticketGross - ticketNet);

        let supplierGross = 0;
        items.forEach(item => {
            if (isSupplierItem(item, supplierFilter)) {
                supplierGross += item.price * item.quantity;
                sCost += (item.cost || 0) * item.quantity;
            }
        });
        sVentaBruta += supplierGross;

        if (ticketDiscount > 0 && supplierGross > 0) {
            const supplierItemIds = items.filter(i => isSupplierItem(i, supplierFilter)).map(i => i.product_id || i.id);
            const otherItemIds = items.filter(i => !isSupplierItem(i, supplierFilter)).map(i => i.product_id || i.id);

            const supplierInPromo = promotions.some(p => {
                let triggers = p.triggerProductIds || p.trigger_product_ids || [];
                if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }
                return Array.isArray(triggers) && triggers.some(pid => supplierItemIds.includes(pid));
            });
            const otherInPromo = promotions.some(p => {
                let triggers = p.triggerProductIds || p.trigger_product_ids || [];
                if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }
                return Array.isArray(triggers) && triggers.some(pid => otherItemIds.includes(pid));
            });

            if (supplierInPromo && !otherInPromo) {
                sTotalDiscount += ticketDiscount;
            } else if (!supplierInPromo && otherInPromo) {
                // none
            } else {
                sTotalDiscount += ticketDiscount * (supplierGross / ticketGross);
            }
        }
    }

    console.log(`--- TREGAR PRODUCT LIST ---`);
    let tregarProductsGross = 0;
    for (const sale of sales) {

        const supplierMap = new Map();

        for (const sale of sales) {
            let itemsResolved = []
            try {
                itemsResolved = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items
                itemsResolved = itemsResolved || []
            } catch (e) { continue }

            // Emulate getSessionDetails Step 1: Resolve supplier
            itemsResolved.forEach(item => {
                let supplierName = 'Desconocido';
                if (isSupplierItem(item, supplierFilter)) supplierName = 'Tregar BCO';
                else supplierName = 'Otros'; // simplified

                const itemGross = item.price * item.quantity;
                item.supplierName = supplierName;

                const current = supplierMap.get(supplierName) || { gross: 0, cost: 0 };
                supplierMap.set(supplierName, {
                    gross: current.gross + itemGross,
                    cost: current.cost + (item.cost || 0) * item.quantity
                });
            });

            // Step 2: Detect matched promos
            const ticketGross = itemsResolved.reduce((sum, i) => sum + (i.price * i.quantity), 0);
            const ticketNet = sale.total - (sale.surcharge || 0);
            const ticketDiscount = Math.max(0, ticketGross - ticketNet);

            if (ticketDiscount > 0) {
                const ticketSupplierGross = new Map();
                itemsResolved.forEach(item => {
                    const itemGross = item.price * item.quantity;
                    ticketSupplierGross.set(item.supplierName, (ticketSupplierGross.get(item.supplierName) || 0) + itemGross);
                });

                const promoSupplierGross = new Map();
                let totalPromoGross = 0;

                itemsResolved.forEach(item => {
                    // Emulate Exact DataReports.tsx:
                    const inPromo = promotions.some(p => {
                        let triggers = p.triggerProductIds || p.trigger_product_ids;
                        if (typeof triggers === 'string') { try { triggers = JSON.parse(triggers) } catch (e) { triggers = [] } }
                        return Array.isArray(triggers) && triggers.includes(item.product_id || item.id);
                    });

                    if (inPromo) {
                        const itemGross = item.price * item.quantity;
                        promoSupplierGross.set(item.supplierName, (promoSupplierGross.get(item.supplierName) || 0) + itemGross);
                        totalPromoGross += itemGross;
                    }
                });

                console.log(`\nSale ${sale.id} - Ticket Gross: ${ticketGross}, Discount: ${ticketDiscount}`);
                console.log(`  Total Promo Gross: ${totalPromoGross}`);
                promoSupplierGross.forEach((val, key) => console.log(`  Promo Gross for ${key}: ${val}`));
                ticketSupplierGross.forEach((val, key) => console.log(`  Ticket Gross for ${key}: ${val}`));

                // Attribute discount
                ticketSupplierGross.forEach((supplierGross, supName) => {
                    let discountShare = 0;
                    if (totalPromoGross > 0) {
                        const supPromoGross = promoSupplierGross.get(supName) || 0;
                        discountShare = ticketDiscount * (supPromoGross / totalPromoGross);
                        if (supName === 'Tregar BCO') {
                            console.log(`  -> Tregar Share = ${ticketDiscount} * (${supPromoGross} / ${totalPromoGross}) = ${discountShare}`);
                        }
                    } else {
                        discountShare = ticketDiscount * (supplierGross / ticketGross);
                        if (supName === 'Tregar BCO') {
                            console.log(`  -> NO PROMO MATCH. Proportional Share = ${ticketDiscount} * (${supplierGross} / ${ticketGross}) = ${discountShare}`);
                        }
                    }

                    if (discountShare > 0) {
                        const current = supplierMap.get(supName);
                        supplierMap.set(supName, { gross: current.gross - discountShare, cost: current.cost });
                    }
                });
            }
        }
    }

    console.log(`\n--- FINAL BREAKDOWN ---`);
    supplierMap.forEach((data, name) => {
        console.log(`${name}: Net = $${data.gross}`);
    });
}
run().catch(console.error)

import { Product, InventoryBatch } from '../../types';

export interface ParsedProductData {
    products: Product[];
    batches: InventoryBatch[];
}

export const parseProductCSV = (csvText: string): ParsedProductData => {
    const lines = csvText.split('\n');
    const products: Product[] = [];
    const batches: InventoryBatch[] = [];

    // Skip header if it exists (usually contains 'name' or 'nombre' or 'barcode')
    const firstLine = lines[0].toLowerCase();
    const startIndex = (firstLine.includes('name') || firstLine.includes('nombre') || firstLine.includes('barcode')) ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // NUEVO FORMATO: barcode,name,cost,profitMargin,price,isPack,supplierId,stock
        const parts = line.split(',').map(s => s.trim());

        // Asignación segura de columnas según el largo
        const barcode = parts[0] || '';
        const name = parts[1] || '';
        const costStr = parts[2] || '0';
        const marginStr = parts[3] || '0';
        const priceStr = parts[4] || '0';
        const isPackStr = parts[5] || 'false';
        const supplierId = parts[6] || '';
        const stockStr = parts[7] || '0';

        if (!name) continue; // Basic validation: el nombre es crítico

        const newProductId = crypto.randomUUID();
        const cost = Number(costStr) || 0;
        let price = Number(priceStr) || 0;
        let profitMargin = Number(marginStr) || 0;
        const isPack = isPackStr.toLowerCase() === 'true' || isPackStr === '1';

        // Recalcular margen si hay costo y precio pero no mandaron margen
        if (cost > 0 && price > 0 && profitMargin === 0) {
            profitMargin = ((price - cost) / cost) * 100;
        }
        // Calcular precio si mandaron costo y margen pero no precio
        else if (cost > 0 && profitMargin > 0 && price === 0) {
            price = Math.ceil(cost * (1 + (profitMargin / 100)));
        }

        const product: Product = {
            id: newProductId,
            name,
            barcode,
            cost,
            price,
            profitMargin,
            supplierId: supplierId || '', // Fix: No enviar 'default' porque Supabase espera UUID o null
            isPack
        };

        products.push(product);

        // Generar lote inicial si se provee stock en el CSV
        const qty = Number(stockStr);
        if (qty > 0) {
            const batch: InventoryBatch = {
                id: crypto.randomUUID(),
                productId: newProductId,
                batchNumber: `IMP-${new Date().toISOString().slice(0, 10)}`,
                quantity: qty,
                originalQuantity: qty,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year fallback
                dateAdded: new Date().toISOString()
            };
            batches.push(batch);
        }
    }

    return { products, batches };
};

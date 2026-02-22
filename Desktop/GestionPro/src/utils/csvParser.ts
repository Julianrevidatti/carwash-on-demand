import { Product, InventoryBatch } from '../../types';

export interface ParsedProductData {
    products: Product[];
    batches: InventoryBatch[];
}

export const parseProductCSV = (csvText: string): ParsedProductData => {
    const lines = csvText.split('\n');
    const products: Product[] = [];
    const batches: InventoryBatch[] = [];

    // Skip header if present (assuming first line is header if it contains "Nombre")
    const startIndex = lines[0].toLowerCase().includes('nombre') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, barcode, cost, price, quantity, supplierId] = line.split(',').map(s => s.trim());

        if (!name || !price) continue; // Basic validation

        const newProductId = crypto.randomUUID();

        const product: Product = {
            id: newProductId,
            name,
            barcode: barcode || '',
            cost: Number(cost) || 0,
            price: Number(price) || 0,
            profitMargin: 0, // Calculate or ignore
            supplierId: supplierId || 'default',
            isPack: false
        };

        // Calculate profit margin if cost and price exist
        if (product.cost > 0 && product.price > 0) {
            product.profitMargin = ((product.price - product.cost) / product.cost) * 100;
        }

        products.push(product);

        // Create initial batch if quantity > 0
        const qty = Number(quantity);
        if (qty > 0) {
            const batch: InventoryBatch = {
                id: crypto.randomUUID(),
                productId: newProductId,
                batchNumber: `IMP-${new Date().toISOString().slice(0, 10)}`,
                quantity: qty,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 1 year expiry
                dateAdded: new Date().toISOString()
            };
            batches.push(batch);
        }
    }

    return { products, batches };
};

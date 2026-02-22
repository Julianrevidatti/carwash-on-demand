
import { InventoryBatch, Product } from "../types";

// Logic to consume stock from batches using FIFO (First In, First Out)
// based on Expiry Date first, then Date Added.
export const deductStockFromBatches = (
  batches: InventoryBatch[],
  productId: string,
  quantityToDeduct: number
): InventoryBatch[] => {
  // 1. Filter batches for this product and sort by Expiry (Ascending)
  const relevantBatches = batches
    .filter(b => b.productId === productId && b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  let remaining = quantityToDeduct;
  const newBatches = [...batches];

  // 2. Iterate and consume
  for (const batch of relevantBatches) {
    if (remaining <= 0) break;

    if (remaining <= 0) break;

    // Use indexOf to find the exact batch instance in the array
    // This works because newBatches is a shallow copy, so it contains the same object references initially
    const batchIndex = newBatches.indexOf(batch);
    if (batchIndex === -1) continue;

    const available = newBatches[batchIndex].quantity;

    if (available >= remaining) {
      newBatches[batchIndex] = { ...newBatches[batchIndex], quantity: available - remaining };
      remaining = 0;
    } else {
      newBatches[batchIndex] = { ...newBatches[batchIndex], quantity: 0 };
      remaining -= available;
    }
  }

  // If remaining > 0, it means we oversold (negative stock logic could go here, or throw error)
  return newBatches;
};

export const getTotalStock = (batches: InventoryBatch[], productId: string): number => {
  return batches
    .filter(b => b.productId === productId)
    .reduce((acc, b) => acc + b.quantity, 0);
};

export const breakPack = (
  products: Product[],
  batches: InventoryBatch[],
  packId: string,
  packBatchId: string
): { updatedBatches: InventoryBatch[], success: boolean } => {
  const packProduct = products.find(p => p.id === packId);
  const packBatch = batches.find(b => b.id === packBatchId);

  if (!packProduct || !packBatch || !packProduct.isPack || !packProduct.childProductId) {
    return { updatedBatches: batches, success: false };
  }

  // 1. Deduct 1 from Pack Batch
  const tempBatches = deductStockFromBatches(batches, packId, 1);

  // 2. Add children to Child Batch
  // We create a new batch for the children inheriting the pack's expiry
  const newChildBatch: InventoryBatch = {
    id: crypto.randomUUID(),
    productId: packProduct.childProductId,
    batchNumber: `${packBatch.batchNumber}-UNPACKED`,
    quantity: packProduct.childQuantity || 1,
    expiryDate: packBatch.expiryDate,
    dateAdded: new Date().toISOString()
  };

  return { updatedBatches: [...tempBatches, newChildBatch], success: true };
};

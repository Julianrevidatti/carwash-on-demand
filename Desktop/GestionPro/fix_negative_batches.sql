-- Fix: Lotes con stock negativo → resetear a 0
-- Detectados en auditoría 2026-03-23 (2 lotes con quantity = -1)
UPDATE inventory_batches SET quantity = 0 WHERE quantity < 0;

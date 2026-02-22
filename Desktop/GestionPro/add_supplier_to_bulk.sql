-- Agregar columna supplier_id a tabla bulk_products

ALTER TABLE bulk_products 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id);

-- Verificar la estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bulk_products'
ORDER BY ordinal_position;

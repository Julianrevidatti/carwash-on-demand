
-- Create a robust, atomic transaction for processing sales to prevent race conditions and duplicates
create or replace function process_sale_transaction(
  p_sale_id uuid,
  p_tenant_id uuid,
  p_user_id uuid,
  p_session_id uuid,
  p_client_id uuid,
  p_payment_method text,
  p_total numeric,
  p_subtotal numeric,
  p_surcharge numeric,
  p_items jsonb,
  p_is_current_account boolean,
  p_date timestamptz
) returns jsonb
language plpgsql
as $$
declare
  v_item jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_is_weighted boolean;
  v_product_name text;
  v_bulk_stock numeric;
  v_batch record;
  v_needed numeric;
  v_take numeric;
  v_sale_exists boolean;
  v_client_balance numeric;
begin
  -- 1. Idempotency Check
  select exists(select 1 from sales where id = p_sale_id) into v_sale_exists;
  if v_sale_exists then
    return jsonb_build_object('status', 'error', 'message', 'Venta ya procesada (Duplicada)');
  end if;

  -- 2. Validate Session (Optional but good practice)
  -- if p_session_id is not null then ... end if;

  -- 3. Stock Validation & Deduction (Locking Phase)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'id')::uuid;
    v_quantity := (v_item->>'quantity')::numeric;
    v_is_weighted := (v_item->>'isWeighted')::boolean; -- Frontend must send this flag
    v_product_name := (v_item->>'name');

    -- BULK PRODUCTS
    if v_is_weighted then
      -- Lock row
      select stock_kg into v_bulk_stock 
      from bulk_products 
      where id = v_product_id and tenant_id = p_tenant_id 
      for update;

      if not found then
         raise exception 'Producto a granel no encontrado: %', v_product_name;
      end if;

      if v_bulk_stock < v_quantity then
         raise exception 'Stock insuficiente para % (Disponible: % kg)', v_product_name, v_bulk_stock;
      end if;

      -- Update Stock
      update bulk_products 
      set stock_kg = stock_kg - v_quantity 
      where id = v_product_id;

      -- Log Movement (Create UUID for movement)
      insert into stock_movements (id, tenant_id, date, product_id, product_name, quantity, reason, detail, type, user_id)
      values (gen_random_uuid(), p_tenant_id, now(), v_product_id, v_product_name, v_quantity, 'Venta (Granel)', 'Venta #' || substring(p_sale_id::text, 1, 8), 'OUT', p_user_id);

    -- REGULAR PRODUCTS (BATCHES)
    else
      v_needed := v_quantity;
      
      -- Check total available first (optional but good for early fail)
      -- Loop through batches with lock
      for v_batch in 
        select * from inventory_batches 
        where product_id = v_product_id and tenant_id = p_tenant_id and quantity > 0 
        order by expiry_date asc 
        for update 
      loop
        if v_needed <= 0 then exit; end if;

        v_take := least(v_batch.quantity, v_needed);
        
        -- Update Batch
        update inventory_batches 
        set quantity = quantity - v_take 
        where id = v_batch.id;

        v_needed := v_needed - v_take;
      end loop;

      if v_needed > 0 then
         raise exception 'Stock insuficiente para % (Faltan: %)', v_product_name, v_needed;
      end if;

      -- Log Movement (We can log one aggregate movement or per batch. Let's do aggregate for simplicity like before)
      insert into stock_movements (id, tenant_id, date, product_id, product_name, quantity, reason, detail, type, user_id)
      values (gen_random_uuid(), p_tenant_id, now(), v_product_id, v_product_name, v_quantity, 'Venta', 'Venta #' || substring(p_sale_id::text, 1, 8), 'OUT', p_user_id);
      
    end if;
  end loop;

  -- 4. Create Sale Record
  insert into sales (id, tenant_id, user_id, session_id, client_id, payment_method, total, subtotal, surcharge, date)
  values (p_sale_id, p_tenant_id, p_user_id, p_session_id, p_client_id, p_payment_method, p_total, p_subtotal, p_surcharge, now());

  -- 5. Create Sale Items
  -- We can use a single INSERT ... SELECT from json to be faster
  insert into sale_items (sale_id, tenant_id, product_id, name, quantity, price, cost)
  select 
    p_sale_id,
    p_tenant_id,
    (item->>'id')::uuid,
    (item->>'name'),
    (item->>'quantity')::numeric,
    (item->>'price')::numeric,
    coalesce((item->>'cost')::numeric, 0)
  from jsonb_array_elements(p_items) as item;

  -- 6. Update Client Balance (if Current Account)
  if p_is_current_account and p_client_id is not null then
    update clients 
    set current_account_balance = current_account_balance + p_total
    where id = p_client_id;
    
    -- Insert Client Movement
    insert into client_movements (tenant_id, client_id, type, amount, description, sale_id, user_id, date)
    values (p_tenant_id, p_client_id, 'DEBT', p_total, 'Compra (Venta #' || substring(p_sale_id::text, 1, 8) || ')', p_sale_id, p_user_id, now());
  end if;

  return jsonb_build_object('status', 'success', 'sale_id', p_sale_id);

exception when others then
  return jsonb_build_object('status', 'error', 'message', SQLERRM);
end;
$$;

-- =========================================
-- BUSCAR TRIGGERS EN LA BASE DE DATOS
-- =========================================
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'public'
ORDER BY 
    event_object_table, trigger_name;

# Directiva: Eliminar Cuentas desde Panel Owner

## Objetivo
Permitir la eliminación de cuentas (tenants) directamente desde el Panel de Owner de Gestión Now. Esto es necesario para limpiar el sistema de cuentas de prueba o cuentas canceladas.

## Componentes Involucrados
1.  **Frontend (React/Next.js):**
    *   `components/SaaSAdmin.tsx`: Agregar el botón de eliminar (ícono de papelera) en la columna de acciones de la tabla de clientes.
    *   Componente Padre (donde se monta `SaaSAdmin`): Implementar o verificar la lógica de la función `onDeleteTenant`.
2.  **Backend/Base de Datos (Supabase/Firebase/Mock):**
    *   Eliminar físicamente o marcar como inactiva/eliminada la cuenta en la base de datos principal.

## Lógica de Ejecución (Pasos)
1.  **Modificar UI (`SaaSAdmin.tsx`):**
    *   Importar ícono `Trash2` de `lucide-react`.
    *   En la tabla de clientes, dentro de `<td className="p-4 text-center space-x-2">`, agregar un botón con el ícono `Trash2`.
    *   El botón debe tener un `onClick` que pregunte una confirmación al usuario antes de llamar a `onDeleteTenant(client.id)`. Ej: `if (window.confirm("¿Seguro que desea eliminar esta cuenta? Todo su contenido se perderá.")) { onDeleteTenant(client.id); }`.
2.  **Verificar Lógica en el Padre:**
    *   Encontrar dónde se usa `<SaaSAdmin ... />`.
    *   Asegurar que la propiedad `onDeleteTenant` esté pasando una función que realmente elimina los datos del lugar de almacenamiento correspondiente (Local Storage, Estado, Base de Datos, etc.).

## Restricciones / Casos Borde
*   **Confirmación Requerida:** Nunca eliminar una cuenta sin antes pedir confirmación explícita (diálogo de confirmación), ya que es una acción destructiva.
*   **Eliminación en Cascada (Advertencia):** Al eliminar un tenant, asegurarse de que los datos huérfanos asociados (si los hay) no sigan ocupando espacio, o bien que el sistema soporte la eliminación de entidades anidadas de acuerdo a su diseño.

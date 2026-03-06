# Restricciones de React y Errores Comunes

## Componentes `React.lazy` (Error #426)
- **Problema**: El visor arroja `Minified React error #426` (A component suspended while responding to synchronous input). Esto suele ocurrir al cargar perezosamente componentes con `React.lazy()` que no están envueltos o no tienen un `<Suspense>` boundary superior en el árbol DOM.
- **Acción (El Paso de Memoria)**: Nunca renderices un componente proveniente de un `lazy` import sin antes envolverlo explícitamente en una etiqueta `<Suspense fallback={...}>`. En este proyecto de React 18, si el administrador (u otro perfil) se renderiza rápidamente en base al estado de login, React arrojará un error 426 porque intenta suspenderse respondiendo a un evento nativo.
- **Solución**: Envolver la renderización en `<Suspense>`, por ejemplo: `<Suspense fallback={<Loader2/>}> <SaaSAdmin /> </Suspense>`.

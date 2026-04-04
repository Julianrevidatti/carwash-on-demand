# SOP de Prácticas de Programación (Kotlin/Android)

Este documento define la lógica y los estándares de programación para el proyecto `carwash-on-demand`.

## Objetivo
Mantener la coherencia arquitectónica y el estilo de código en todas las nuevas funcionalidades.

## Estándares Técnicos
- **Lenguaje:** Kotlin
- **Arquitectura:** MVVM (Model-View-ViewModel)
- **Estructura de Paquetes:**
    - `ui.[feature]` - Fragmentos y ViewModels por funcionalidad.
    - `data.model` - Clases de datos (Models).
    - `data.repository` - Lógica de acceso a datos (Firestore).
    - `utils` - Clases de apoyo (PriceCalculator, Validators, etc.).
- **Gestión de UI:** Fragmentos con ViewBinding.
- **Navegación:** Navigation Component (`mobile_navigation.xml`).
- **Base de Datos:** Firebase Firestore.

## Lógica de Desarrollo
1. **Modelado:** Definir modelos en `data/model/Models.kt` (o archivos separados si crecen).
2. **Repositorios:** Implementar interfaces de datos en `data/repository/`.
3. **ViewModels:** Colocar en `ui/[feature]/[Feature]ViewModel.kt`.
4. **Fragmentos:** Vincular Layouts XML en `ui/[feature]/[Feature]Fragment.kt`.

## Restricciones y Casos Borde
- **Nomenclatura:**
    - Fragmentos: `[Name]Fragment.kt`
    - ViewModels: `[Name]ViewModel.kt`
    - Repositorios: `[Name]Repository.kt`
    - Layouts: `fragment_[name].xml` o `item_[name].xml`
- **Inyección de Dependencias:** No se detecta Hilt/Koin; el manejo parece ser mediante instanciación en ViewModels/Activities.
- **Seguridad:** No subir `google-services.json` a repositorios públicos (está en .gitignore).

## Trampas Conocidas
- **Fugas de Memoria:** No olvidar setear `_binding = null` en `onDestroyView` de los Fragmentos.
- **Contexto en Repositorios:** Evitar pasar `Activity` o `Fragment` a los repositorios; usar `ApplicationContext` si es necesario.

---
*Nota: Este SOP se actualiza automáticamente después de cada ciclo de construcción o análisis.*

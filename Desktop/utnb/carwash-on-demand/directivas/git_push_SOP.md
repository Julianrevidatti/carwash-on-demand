# Directiva: Subir Cambios al Repositorio (Git Push)

## Objetivo
Asegurar que los cambios locales se suban correctamente al repositorio remoto sin errores de rama o conflictos.

## Entradas
- Cambios locales pendientes.
- Nombre de la rama remota y local.

## Lógica y Pasos
1. **Verificar rama**: Identificar la rama actual (`git branch`).
2. **Preparar cambios**: Añadir los archivos deseados (`git add .`).
3. **Commit**: Crear un commit con un mensaje descriptivo (`git commit -m "..."`).
4. **Push**: Subir a la rama correspondiente (`git push origin <branch_name>`).
   - Nota: Si la rama remota es `main` y la local es `master`, se puede usar `git push origin master:main` si se desea fusionar, o simplemente `git push origin master`.

## Restricciones y Advertencias
- **IMPORTANTE**: Verificar que archivos sensibles (.env, local.properties) estén ignorados antes de hacer `git add`.
- **ERROR COMÚN**: "src refspec main does not match any". Ocurre cuando se intenta pushear a `main` pero la rama local se llama `master` o no tiene commits.
- **REGLA**: Asegurarse de estar en la rama correcta antes de operar.

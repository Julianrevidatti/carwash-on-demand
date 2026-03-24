import os
import subprocess
import sys

# Script basado en directivas/compilar_exe_SOP.md

def build_electron_app(project_path):
    print(f"[{project_path}] Iniciando proceso de compilación...")
    
    if not os.path.exists(project_path):
        print(f"[{project_path}] ERROR: El directorio no existe.")
        return False
        
    package_json_path = os.path.join(project_path, "package.json")
    if not os.path.exists(package_json_path):
        print(f"[{project_path}] ERROR: No se encontró package.json.")
        return False

    try:
        # Paso 1: Instalar dependencias
        print(f"[{project_path}] Ejecutando 'npm install'...")
        subprocess.run(
            ["npm", "install"], 
            cwd=project_path, 
            check=True,
            shell=True
        )
        
        # Paso 2: Ejecutar empaquetado
        print(f"[{project_path}] Ejecutando 'npm run build'...")
        subprocess.run(
            ["npm", "run", "build"], 
            cwd=project_path, 
            check=True,
            shell=True
        )
        
        print(f"[{project_path}] ¡Compilación finalizada exitosamente!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"[{project_path}] ERROR durante la ejecución de los comandos NPM: {e}")
        return False
    except FileNotFoundError:
        print(f"[{project_path}] ERROR: No se encontró NPM en el sistema.")
        return False

def main():
    base_path = r"c:\Users\54112\Desktop\GestionPro"
    # Proyectos a compilar
    projects = ["StockPro", "FashionPro"]
    
    success_count = 0
    for proj in projects:
        proj_dir = os.path.join(base_path, proj)
        print(f"\n==============================")
        print(f"Procesando: {proj}")
        print(f"==============================")
        
        if build_electron_app(proj_dir):
            success_count += 1
            
    print(f"\nProceso finalizado. Total compilaciones exitosas: {success_count}/{len(projects)}")
    
    if success_count < len(projects):
        sys.exit(1)

if __name__ == "__main__":
    main()

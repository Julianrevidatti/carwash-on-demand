import os

def generar_publicidad_formal():
    ad = """\
¿Cansado de administrar su negocio con papel y bolígrafo? 📊

Como comerciantes, sabemos que cada ingreso es importante. Por eso desarrollamos el sistema Gestion Now: una herramienta de mostrador completa y ágil, diseñada para optimizar el funcionamiento de su local.

Somos un equipo que se propuso eliminar las complicaciones de los cierres diarios y los altos costos operativos. Así creamos esta solución práctica. Observe las funciones incluidas por menos de 10.000 (9.999 al m3s):

- Cierres de caja precisos (simplifique su rutina nocturna).
- Inventario real y actualizado.
- Accesible mediante navegador web, sin requerir instalaciones complejas.
- Curva de aprendizaje muy breve.

BENEFICIOS ADICIONALES (fundamentales para su tranquilidad):
👉 Asignación de permisos por empleado
👉 Visualización de métricas en directo desde su celular
👉 Alertas de mercadería por caducar y gestión de lotes
👉 Control detallado de contabilidad y gastos fijos

Optimice su tiempo y evite diferencias en su inventario. Si le interesa nuestra propuesta, por favor envíe un mensaje o deje su comentario, y le brindaremos acceso por unos días sin cargo alguno para que la evalúe. 👇\
"""
    # Crear carpeta .tmp si no existe
    os.makedirs(r"c:\Users\54112\Desktop\GestionPro\.tmp", exist_ok=True)
    
    # Escribir el archivo
    filepath = r"c:\Users\54112\Desktop\GestionPro\.tmp\publicidades_facebook_formal.txt"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(ad)
        
    print(f"Texto antibot formalizado exitosamente en: {filepath}")

if __name__ == "__main__":
    generar_publicidad_formal()

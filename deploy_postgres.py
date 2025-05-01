#!/usr/bin/env python3
import os
import sys
import subprocess

def main():
    """
    Script para ejecutar el script deploy_postgres.py desde el backend.
    Este script es llamado desde el servicio de NestJS.
    """
    print("Iniciando carga de datos a PostgreSQL...")
    
    # Ruta al script original
    script_path = "/postgresql/data_cluster/deploy_postgres.py"
    
    if not os.path.exists(script_path):
        print(f"Error: El script no existe en la ruta {script_path}")
        return 1
    
    try:
        # Ejecutar el script con los parámetros de entorno necesarios
        result = subprocess.run(
            ["python3", script_path],
            env={
                "DB_HOST": os.environ.get("DB_HOST", "postgres"),
                "DB_PORT": os.environ.get("DB_PORT", "5432"),
                "DB_USER": os.environ.get("DB_USER", "postgres"),
                "DB_PASSWORD": os.environ.get("DB_PASSWORD", "postgres"),
                "DB_NAME": os.environ.get("DB_NAME", "videodata"),
                "PATH": os.environ.get("PATH", "")
            },
            check=True,
            capture_output=True,
            text=True
        )
        
        # Imprimir la salida del script
        print(result.stdout)
        
        if result.stderr:
            print(f"Advertencias/Errores: {result.stderr}")
        
        print("Carga de datos completada con éxito.")
        return 0
    
    except subprocess.CalledProcessError as e:
        print(f"Error al ejecutar el script deploy_postgres.py: {e}")
        print(f"Salida de error: {e.stderr}")
        return 1
    except Exception as e:
        print(f"Error inesperado: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
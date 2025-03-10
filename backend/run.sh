#!/bin/bash
# Script para activar el entorno virtual y ejecutar la aplicación

# Activar el entorno virtual
source venv/bin/activate

# Ejecutar la aplicación
uvicorn src.main:app --reload

# Nota: para salir del entorno virtual cuando termines, ejecuta 'deactivate'

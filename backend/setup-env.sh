# En la carpeta del backend, crea un entorno virtual
cd /home/juanbau/Desarrollos/ReservasAbby/backend
python -m venv venv
source venv/bin/activate

# Instala las dependencias en este entorno virtual
pip install fastapi uvicorn

# Ahora puedes ejecutar tu aplicación utilizando este entorno
# uvicorn src.main:app --reload

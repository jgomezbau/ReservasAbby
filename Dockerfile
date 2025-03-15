# ...existing code...
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Añadir esta línea para instalar pydantic-settings explícitamente
RUN pip install --no-cache-dir pydantic-settings
COPY ./src /app/src
# ...existing code...
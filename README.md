# Sistema de Gestión de Reservas Abby House
# Proyecto en Desarrollo, no funciona aun

Sistema web para gestionar reservas de propiedades en Airbnb, Booking y reservas particulares.

## Características

- Calendario visual de reservas
- Gestión de caja con ingresos y egresos
- División de ingresos y egresos por socio (Maxy, Oso y Laura)
- Resumen de ganancias
- Integración con APIs de Airbnb y Booking

## Tecnologías

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Tailwind CSS, FullCalendar
- **Infraestructura**: Docker, Docker Compose

## Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/) y [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 o superior)
- [Python](https://www.python.org/downloads/) (v3.11 o superior)
- [PostgreSQL](https://www.postgresql.org/download/) (sólo si ejecutas sin Docker)
- [Visual Studio Code](https://code.visualstudio.com/) con [extensión Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) (recomendado)

## Instrucciones de Instalación

### Método 1: Utilizando Docker (Recomendado)

Este método ejecuta toda la aplicación con un solo comando utilizando contenedores Docker.

```bash
# Clonar el repositorio
git clone <repo-url>
cd ReservasAbby

# Crear archivo .env desde el ejemplo (si no existe)
cp .env.example .env

# Iniciar los servicios
docker compose up -d
```

La aplicación estará disponible en:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- Documentación API: [http://localhost:8000/docs](http://localhost:8000/docs)
- Base de datos PostgreSQL: localhost:5432

### Método 2: Ejecutando Componentes por Separado

#### Paso 1: Configurar la Base de Datos

Para probar el desarrollo local, necesitarás PostgreSQL. Puedes:

**Opción A: Usar la base de datos en Docker**
```bash
# Iniciar sólo el contenedor de la base de datos
docker compose up -d db

# Verificar que está funcionando
docker ps
```

**Opción B: Instalar PostgreSQL localmente**
1. Instala PostgreSQL en tu sistema
2. Crea una base de datos llamada `reservas_abby`
3. Configura los detalles de conexión en el archivo `.env`

#### Paso 2: Ejecutar el Backend

```bash
# Navegar al directorio backend
cd backend

# Crear y activar entorno virtual
python -m venv venv
source venv/bin/activate  # En Linux/Mac
# En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Ejecutar el servidor de desarrollo
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en [http://localhost:8000](http://localhost:8000)

#### Paso 3: Ejecutar el Frontend

```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

El frontend estará disponible en [http://localhost:3000](http://localhost:3000)

## Gestión con Docker en Visual Studio Code

La extensión Docker de VS Code proporciona herramientas visuales para administrar contenedores:

1. Abre VS Code e instala la extensión Docker si aún no lo has hecho
2. Navega al panel de Docker en la barra lateral izquierda
3. Allí podrás:
   - Ver contenedores en ejecución
   - Iniciar/detener/reiniciar contenedores
   - Ver logs de contenedores
   - Acceder a la terminal de un contenedor
   - Eliminar contenedores y imágenes

Para ver los logs del backend (útil para depuración):
1. En el panel de Docker, encuentra `reservasabby-backend-1`
2. Haz clic derecho y selecciona "View Logs"

## Solución de Problemas Comunes

### El backend no se inicia

Si el contenedor `backend` se reinicia constantemente:

```bash
# Ver los logs para identificar el problema
docker logs reservasabby-backend-1
```

Problemas comunes:
- Falta módulos Python requeridos → Actualiza requirements.txt
- Errores de importación → Verifica la estructura de carpetas
- No puede conectarse a la base de datos → Verifica variables de entorno

### Acceso a la Base de Datos

Para conectarte directamente a la base de datos PostgreSQL:

```bash
# Usando el cliente psql dentro del contenedor
docker exec -it reservasabby-db-1 psql -U postgres -d reservas_abby

# O usando herramientas como pgAdmin con:
# Host: localhost
# Puerto: 5432
# Usuario: postgres
# Contraseña: postgres (o la establecida en .env)
# Base de datos: reservas_abby
```

### Reiniciar la Aplicación

```bash
# Detener todos los contenedores
docker compose down

# Iniciar todos los contenedores
docker compose up -d
```

### Reconstruir la Aplicación tras Cambios

```bash
# Reconstruir todos los servicios e iniciarlos
docker compose up -d --build
```

## Estructura del Proyecto

```
ReservasAbby/
├── backend/            # Servidor FastAPI
│   ├── src/            # Código fuente del backend
│   ├── requirements.txt # Dependencias Python
│   └── Dockerfile      # Instrucciones para construir imagen backend
├── frontend/           # Aplicación React
│   ├── src/            # Código fuente del frontend
│   ├── public/         # Archivos estáticos
│   ├── package.json    # Dependencias y scripts
│   └── Dockerfile      # Instrucciones para construir imagen frontend
├── docker-compose.yml  # Configuración de servicios
└── .env                # Variables de entorno (no subir al repositorio)
```

## Desarrollo y Contribuciones

Para desarrollar nuevas características:

1. Crea una rama para tu característica
2. Realiza tus cambios
3. Ejecuta pruebas
4. Envía un pull request
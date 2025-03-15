import os
from typing import Any, Dict, List, Optional, Union
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Reservas Abby House"
    
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "reservas_abby")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    SQLALCHEMY_DATABASE_URI: Optional[PostgresDsn] = None

    @validator("SQLALCHEMY_DATABASE_URI", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        if isinstance(v, str):
            return v
        
        # En Pydantic v2, no podemos usar PostgresDsn.build con esos parámetros
        # En su lugar, construimos la URL manualmente
        user = values.get("POSTGRES_USER")
        password = values.get("POSTGRES_PASSWORD")
        host = values.get("POSTGRES_SERVER")
        port = values.get("POSTGRES_PORT")
        db = values.get('POSTGRES_DB', '')
        
        # Construir la URL de conexión manualmente
        return f"postgresql://{user}:{password}@{host}:{port}/{db}"
    
    # Configuración CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost",
        "https://reservasabby.com",
    ]

    # Configuración de APIs externas
    AIRBNB_API_URL: Optional[str] = os.getenv("AIRBNB_API_URL")
    AIRBNB_API_KEY: Optional[str] = os.getenv("AIRBNB_API_KEY")
    BOOKING_API_URL: Optional[str] = os.getenv("BOOKING_API_URL")
    BOOKING_API_KEY: Optional[str] = os.getenv("BOOKING_API_KEY")

    class Config:
        case_sensitive = True


settings = Settings()
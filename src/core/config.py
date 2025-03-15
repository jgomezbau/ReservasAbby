# Reemplazar esta línea:
from pydantic import BaseSettings, PostgresDsn, validator
# Por estas líneas:
from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, validator
# ...existing code...

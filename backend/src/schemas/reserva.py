from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from ..models.reserva import PlataformaEnum, EstadoReservaEnum

class PropiedadBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class PropiedadCreate(PropiedadBase):
    pass

class PropiedadUpdate(PropiedadBase):
    nombre: Optional[str] = None

class PropiedadInDB(PropiedadBase):
    id: int
    
    class Config:
        from_attributes = True

class ReservaBase(BaseModel):
    fecha_ingreso: date
    fecha_salida: date
    nombre_huesped: str
    plataforma: PlataformaEnum
    estado: Optional[EstadoReservaEnum] = EstadoReservaEnum.PENDIENTE
    monto_total_usd: float = Field(ge=0)
    monto_sena_usd: Optional[float] = Field(default=None, ge=0)
    notas: Optional[str] = None
    propiedad_id: int

class ReservaCreate(ReservaBase):
    pass

class ReservaUpdate(BaseModel):
    fecha_ingreso: Optional[date] = None
    fecha_salida: Optional[date] = None
    nombre_huesped: Optional[str] = None
    plataforma: Optional[PlataformaEnum] = None
    estado: Optional[EstadoReservaEnum] = None
    monto_total_usd: Optional[float] = Field(default=None, ge=0)
    monto_sena_usd: Optional[float] = Field(default=None, ge=0)
    notas: Optional[str] = None
    propiedad_id: Optional[int] = None

class ReservaInDB(ReservaBase):
    id: int
    
    class Config:
        from_attributes = True

class ReservaWithPropiedad(ReservaInDB):
    propiedad: PropiedadInDB
    
    class Config:
        from_attributes = True

class CalendarioReserva(BaseModel):
    id: int
    title: str  # nombre_huesped + plataforma
    start: date  # fecha_ingreso
    end: date    # fecha_salida
    backgroundColor: Optional[str] = None  # Color según plataforma
    borderColor: Optional[str] = None
    textColor: Optional[str] = "#ffffff"
    extendedProps: dict  # Datos adicionales
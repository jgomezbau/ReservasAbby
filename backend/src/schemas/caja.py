from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date
from ..models.caja import TipoMovimientoEnum, MonedaEnum, SocioEnum

class CategoriaMovimientoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    tipo: TipoMovimientoEnum

class CategoriaMovimientoCreate(CategoriaMovimientoBase):
    pass

class CategoriaMovimientoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    tipo: Optional[TipoMovimientoEnum] = None

class CategoriaMovimientoInDB(CategoriaMovimientoBase):
    id: int
    
    class Config:
        from_attributes = True

class MovimientoCajaBase(BaseModel):
    fecha: date
    tipo: TipoMovimientoEnum
    categoria_id: int
    descripcion: Optional[str] = None
    monto: float = Field(gt=0)
    moneda: MonedaEnum = MonedaEnum.PESOS
    tipo_cambio: Optional[float] = None
    socio: SocioEnum
    relacionado_reserva_id: Optional[int] = None

class MovimientoCajaCreate(MovimientoCajaBase):
    pass

class MovimientoCajaUpdate(BaseModel):
    fecha: Optional[date] = None
    tipo: Optional[TipoMovimientoEnum] = None
    categoria_id: Optional[int] = None
    descripcion: Optional[str] = None
    monto: Optional[float] = Field(default=None, gt=0)
    moneda: Optional[MonedaEnum] = None
    tipo_cambio: Optional[float] = None
    socio: Optional[SocioEnum] = None
    relacionado_reserva_id: Optional[int] = None

class MovimientoCajaInDB(MovimientoCajaBase):
    id: int
    
    class Config:
        from_attributes = True

class MovimientoCajaWithRelaciones(MovimientoCajaInDB):
    categoria: CategoriaMovimientoInDB
    
    class Config:
        from_attributes = True

class ResumenCaja(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    total_ingresos_pesos: float
    total_egresos_pesos: float
    balance_pesos: float
    total_ingresos_usd: float
    total_egresos_usd: float
    balance_usd: float
    desglose_por_socio: Dict[str, Dict[str, float]]
    desglose_por_categoria: Dict[str, float]

class ResumenMensual(BaseModel):
    mes: int
    anio: int
    total_ingresos_pesos: float
    total_egresos_pesos: float
    balance_pesos: float
    reservas_total: int
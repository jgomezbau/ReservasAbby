from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Enum, Boolean, Text
from sqlalchemy.orm import relationship
import enum
from ..db.database import Base

class TipoMovimientoEnum(str, enum.Enum):
    INGRESO = "Ingreso"
    EGRESO = "Egreso"

class MonedaEnum(str, enum.Enum):
    PESOS = "ARS"
    DOLARES = "USD"

class SocioEnum(str, enum.Enum):
    MAXY = "Maxy"
    OSO = "Oso"
    LAURA = "Laura"
    TODOS = "Todos"

class CategoriaMovimiento(Base):
    __tablename__ = "categorias_movimiento"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False, unique=True)
    descripcion = Column(String, nullable=True)
    tipo = Column(Enum(TipoMovimientoEnum), nullable=False)
    
    movimientos = relationship("MovimientoCaja", back_populates="categoria")

class MovimientoCaja(Base):
    __tablename__ = "movimientos_caja"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False)
    tipo = Column(Enum(TipoMovimientoEnum), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_movimiento.id"), nullable=False)
    descripcion = Column(Text, nullable=True)
    monto = Column(Float, nullable=False)
    moneda = Column(Enum(MonedaEnum), nullable=False, default=MonedaEnum.PESOS)
    tipo_cambio = Column(Float, nullable=True)  # Cuando es en USD, guardar el tipo de cambio
    socio = Column(Enum(SocioEnum), nullable=False)
    relacionado_reserva_id = Column(Integer, ForeignKey("reservas.id"), nullable=True)
    
    categoria = relationship("CategoriaMovimiento", back_populates="movimientos")
    reserva = relationship("Reserva", backref="movimientos_caja")
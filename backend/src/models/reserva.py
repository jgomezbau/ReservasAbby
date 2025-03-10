from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from ..db.database import Base

class PlataformaEnum(str, enum.Enum):
    AIRBNB = "Airbnb"
    BOOKING = "Booking"
    PARTICULAR = "Particular"
    OTRO = "Otro"

class EstadoReservaEnum(str, enum.Enum):
    CONFIRMADA = "Confirmada"
    PENDIENTE = "Pendiente"
    CANCELADA = "Cancelada"
    COMPLETADA = "Completada"

class Propiedad(Base):
    __tablename__ = "propiedades"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    
    reservas = relationship("Reserva", back_populates="propiedad")

class Reserva(Base):
    __tablename__ = "reservas"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha_ingreso = Column(Date, nullable=False)
    fecha_salida = Column(Date, nullable=False)
    nombre_huesped = Column(String, nullable=False)
    plataforma = Column(Enum(PlataformaEnum), nullable=False)
    estado = Column(Enum(EstadoReservaEnum), default=EstadoReservaEnum.PENDIENTE)
    monto_total_usd = Column(Float, nullable=False)
    monto_sena_usd = Column(Float, nullable=True)
    notas = Column(String, nullable=True)
    propiedad_id = Column(Integer, ForeignKey("propiedades.id"))
    
    propiedad = relationship("Propiedad", back_populates="reservas")
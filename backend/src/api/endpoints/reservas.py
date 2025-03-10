from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, timedelta

from ...db.database import get_db
from ...models import Reserva, Propiedad, PlataformaEnum
from ...schemas import ReservaCreate, ReservaUpdate, ReservaInDB, ReservaWithPropiedad, CalendarioReserva

router = APIRouter()

# Mapeo de colores para cada plataforma
PLATAFORMA_COLORES = {
    PlataformaEnum.AIRBNB: "#FF5A5F",
    PlataformaEnum.BOOKING: "#003580",
    PlataformaEnum.PARTICULAR: "#27AE60",
    PlataformaEnum.OTRO: "#F39C12",
}

@router.post("/", response_model=ReservaInDB, status_code=status.HTTP_201_CREATED)
def create_reserva(reserva: ReservaCreate, db: Session = Depends(get_db)):
    # Verificar que la propiedad existe
    db_propiedad = db.query(Propiedad).filter(Propiedad.id == reserva.propiedad_id).first()
    if not db_propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # Verificar que no haya reservas superpuestas
    reservas_superpuestas = db.query(Reserva).filter(
        Reserva.propiedad_id == reserva.propiedad_id,
        Reserva.fecha_salida > reserva.fecha_ingreso,
        Reserva.fecha_ingreso < reserva.fecha_salida
    ).first()
    
    if reservas_superpuestas:
        raise HTTPException(
            status_code=400, 
            detail="Ya existe una reserva para la propiedad en el período solicitado"
        )
    
    db_reserva = Reserva(**reserva.dict())
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

@router.get("/", response_model=List[ReservaWithPropiedad])
def read_reservas(
    skip: int = 0, 
    limit: int = 100, 
    propiedad_id: Optional[int] = None,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    plataforma: Optional[PlataformaEnum] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Reserva)
    
    if propiedad_id:
        query = query.filter(Reserva.propiedad_id == propiedad_id)
    
    if desde:
        query = query.filter(Reserva.fecha_salida > desde)
    
    if hasta:
        query = query.filter(Reserva.fecha_ingreso < hasta)
    
    if plataforma:
        query = query.filter(Reserva.plataforma == plataforma)
    
    # Ordenar por fecha de ingreso descendente
    query = query.order_by(Reserva.fecha_ingreso.desc())
    
    reservas = query.offset(skip).limit(limit).all()
    return reservas

@router.get("/calendario")
def get_reservas_calendario(
    desde: Optional[date] = Query(None, description="Fecha de inicio para el calendario"),
    hasta: Optional[date] = Query(None, description="Fecha de fin para el calendario"),
    propiedad_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Si no se especifican fechas, usar el mes actual
    if not desde:
        today = date.today()
        desde = date(today.year, today.month, 1)
    
    if not hasta:
        next_month = desde.replace(day=28) + timedelta(days=4)
        hasta = next_month.replace(day=1) - timedelta(days=1)
        hasta = date(next_month.year, next_month.month, 1) - timedelta(days=1)
    
    query = db.query(Reserva).filter(
        Reserva.fecha_salida > desde,
        Reserva.fecha_ingreso < hasta
    )
    
    if propiedad_id:
        query = query.filter(Reserva.propiedad_id == propiedad_id)
    
    reservas = query.all()
    
    # Convertir a formato de calendario
    eventos = []
    for reserva in reservas:
        propiedad = db.query(Propiedad).filter(Propiedad.id == reserva.propiedad_id).first()
        color = PLATAFORMA_COLORES.get(reserva.plataforma, "#3788D8")
        
        evento = CalendarioReserva(
            id=reserva.id,
            title=f"{reserva.nombre_huesped} ({propiedad.nombre})",
            start=reserva.fecha_ingreso,
            end=reserva.fecha_salida,
            backgroundColor=color,
            borderColor=color,
            textColor="#FFFFFF",
            extendedProps={
                "plataforma": reserva.plataforma,
                "monto_total_usd": reserva.monto_total_usd,
                "monto_sena_usd": reserva.monto_sena_usd,
                "notas": reserva.notas,
                "propiedad": propiedad.nombre,
                "estado": reserva.estado,
            }
        )
        eventos.append(evento)
    
    return eventos

@router.get("/{reserva_id}", response_model=ReservaWithPropiedad)
def read_reserva(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if reserva is None:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reserva

@router.put("/{reserva_id}", response_model=ReservaInDB)
def update_reserva(reserva_id: int, reserva: ReservaUpdate, db: Session = Depends(get_db)):
    db_reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if db_reserva is None:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Si se actualiza la propiedad, verificar que exista
    if reserva.propiedad_id is not None:
        db_propiedad = db.query(Propiedad).filter(Propiedad.id == reserva.propiedad_id).first()
        if not db_propiedad:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # Si se actualizan las fechas, verificar que no haya superposiciones
    fecha_ingreso = reserva.fecha_ingreso or db_reserva.fecha_ingreso
    fecha_salida = reserva.fecha_salida or db_reserva.fecha_salida
    propiedad_id = reserva.propiedad_id or db_reserva.propiedad_id
    
    if reserva.fecha_ingreso or reserva.fecha_salida or reserva.propiedad_id:
        reservas_superpuestas = db.query(Reserva).filter(
            Reserva.id != reserva_id,
            Reserva.propiedad_id == propiedad_id,
            Reserva.fecha_salida > fecha_ingreso,
            Reserva.fecha_ingreso < fecha_salida
        ).first()
        
        if reservas_superpuestas:
            raise HTTPException(
                status_code=400, 
                detail="Ya existe una reserva para la propiedad en el período actualizado"
            )
    
    update_data = reserva.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_reserva, key, value)
    
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

@router.delete("/{reserva_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reserva(reserva_id: int, db: Session = Depends(get_db)):
    db_reserva = db.query(Reserva).filter(Reserva.id == reserva_id).first()
    if db_reserva is None:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    db.delete(db_reserva)
    db.commit()
    return None
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import requests
from datetime import datetime, date
import os
from dotenv import load_dotenv

from ...db.database import get_db
from ...models import Reserva, PlataformaEnum, EstadoReservaEnum, Propiedad
from ...schemas import ReservaCreate

router = APIRouter()

load_dotenv()

# Cargar claves de API desde variables de entorno
AIRBNB_API_KEY = os.getenv("AIRBNB_API_KEY")
BOOKING_API_KEY = os.getenv("BOOKING_API_KEY")

@router.post("/airbnb/sync", status_code=status.HTTP_200_OK)
async def sync_airbnb_reservations(
    propiedad_id: int,
    desde: date = Body(...),
    hasta: date = Body(...),
    db: Session = Depends(get_db)
):
    """
    Sincroniza las reservas de Airbnb para una propiedad específica en un rango de fechas.
    Nota: Esta es una implementación de muestra. La integración real dependerá de la API de Airbnb.
    """
    if not AIRBNB_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key de Airbnb no configurada"
        )
    
    # Verificar que la propiedad existe
    propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # En una implementación real, aquí se haría la llamada a la API de Airbnb
    # Usando requests para obtener las reservas
    # Por ahora, simulamos una respuesta
    
    # Resultado simulado
    nuevas_reservas = 0
    actualizadas = 0
    
    # En una implementación real, se procesarían las reservas obtenidas
    # y se guardarían en la base de datos
    
    return {
        "mensaje": f"Sincronización completada: {nuevas_reservas} nuevas reservas, {actualizadas} actualizadas",
        "propiedad": propiedad.nombre,
        "plataforma": "Airbnb",
        "desde": desde,
        "hasta": hasta
    }

@router.post("/booking/sync", status_code=status.HTTP_200_OK)
async def sync_booking_reservations(
    propiedad_id: int,
    desde: date = Body(...),
    hasta: date = Body(...),
    db: Session = Depends(get_db)
):
    """
    Sincroniza las reservas de Booking para una propiedad específica en un rango de fechas.
    Nota: Esta es una implementación de muestra. La integración real dependerá de la API de Booking.
    """
    if not BOOKING_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key de Booking no configurada"
        )
    
    # Verificar que la propiedad existe
    propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # En una implementación real, aquí se haría la llamada a la API de Booking
    # Usando requests para obtener las reservas
    # Por ahora, simulamos una respuesta
    
    # Resultado simulado
    nuevas_reservas = 0
    actualizadas = 0
    
    # En una implementación real, se procesarían las reservas obtenidas
    # y se guardarían en la base de datos
    
    return {
        "mensaje": f"Sincronización completada: {nuevas_reservas} nuevas reservas, {actualizadas} actualizadas",
        "propiedad": propiedad.nombre,
        "plataforma": "Booking",
        "desde": desde,
        "hasta": hasta
    }

@router.post("/importar-excel", status_code=status.HTTP_200_OK)
async def import_from_excel(
    file_path: str = Body(...),
    propiedad_id: int = Body(...),
    db: Session = Depends(get_db)
):
    """
    Importa reservas desde un archivo Excel.
    """
    import pandas as pd
    from pathlib import Path
    
    # Verificar que la propiedad existe
    propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    # Verificar que el archivo existe
    file = Path(file_path)
    if not file.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    try:
        # Leer el archivo Excel
        df = pd.read_excel(file_path)
        
        # Implementación de ejemplo: se asume un formato específico
        # En una implementación real, se debería validar y mapear adecuadamente
        
        nuevas_reservas = 0
        
        # Procesar las filas (implementación de ejemplo)
        for _, row in df.iterrows():
            try:
                # Mapeo de ejemplo (adaptar a la estructura real del Excel)
                nueva_reserva = ReservaCreate(
                    fecha_ingreso=row.get('fecha_ingreso'),
                    fecha_salida=row.get('fecha_salida'),
                    nombre_huesped=row.get('nombre_huesped', 'Sin nombre'),
                    plataforma=PlataformaEnum(row.get('plataforma', 'Otro')),
                    monto_total_usd=float(row.get('monto_total', 0)),
                    monto_sena_usd=float(row.get('monto_sena', 0)) if 'monto_sena' in row else None,
                    notas=row.get('notas', ''),
                    propiedad_id=propiedad_id
                )
                
                # Verificar si ya existe una reserva para esas fechas
                reserva_existente = db.query(Reserva).filter(
                    Reserva.propiedad_id == propiedad_id,
                    Reserva.fecha_ingreso == nueva_reserva.fecha_ingreso,
                    Reserva.fecha_salida == nueva_reserva.fecha_salida
                ).first()
                
                if not reserva_existente:
                    # Crear nueva reserva
                    db_reserva = Reserva(**nueva_reserva.dict())
                    db.add(db_reserva)
                    nuevas_reservas += 1
            
            except Exception as e:
                # Continuar con la siguiente fila si hay error
                continue
        
        # Guardar cambios en la base de datos
        db.commit()
        
        return {
            "mensaje": f"Importación completada: {nuevas_reservas} nuevas reservas",
            "propiedad": propiedad.nombre
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar el archivo: {str(e)}"
        )
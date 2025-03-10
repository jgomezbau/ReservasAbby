from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Optional
from datetime import date, datetime, timedelta

from ...db.database import get_db
from ...models import MovimientoCaja, CategoriaMovimiento, TipoMovimientoEnum, MonedaEnum, SocioEnum
from ...schemas import MovimientoCajaCreate, MovimientoCajaUpdate, MovimientoCajaInDB, MovimientoCajaWithRelaciones, ResumenCaja, ResumenMensual

router = APIRouter()

@router.post("/", response_model=MovimientoCajaInDB, status_code=status.HTTP_201_CREATED)
def create_movimiento(movimiento: MovimientoCajaCreate, db: Session = Depends(get_db)):
    # Verificar que la categoría existe
    db_categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.id == movimiento.categoria_id).first()
    if not db_categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar que el tipo de movimiento coincide con el tipo de la categoría
    if db_categoria.tipo != movimiento.tipo:
        raise HTTPException(
            status_code=400, 
            detail=f"El tipo de movimiento debe ser {db_categoria.tipo} para la categoría seleccionada"
        )
    
    # Si es en USD, el tipo de cambio es obligatorio
    if movimiento.moneda == MonedaEnum.DOLARES and not movimiento.tipo_cambio:
        raise HTTPException(
            status_code=400,
            detail="El tipo de cambio es obligatorio para movimientos en dólares"
        )
    
    db_movimiento = MovimientoCaja(**movimiento.dict())
    db.add(db_movimiento)
    db.commit()
    db.refresh(db_movimiento)
    return db_movimiento

@router.get("/", response_model=List[MovimientoCajaWithRelaciones])
def read_movimientos(
    skip: int = 0, 
    limit: int = 100, 
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
    tipo: Optional[TipoMovimientoEnum] = None,
    categoria_id: Optional[int] = None,
    socio: Optional[SocioEnum] = None,
    moneda: Optional[MonedaEnum] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MovimientoCaja)
    
    if desde:
        query = query.filter(MovimientoCaja.fecha >= desde)
    
    if hasta:
        query = query.filter(MovimientoCaja.fecha <= hasta)
    
    if tipo:
        query = query.filter(MovimientoCaja.tipo == tipo)
    
    if categoria_id:
        query = query.filter(MovimientoCaja.categoria_id == categoria_id)
    
    if socio:
        query = query.filter(MovimientoCaja.socio == socio)
    
    if moneda:
        query = query.filter(MovimientoCaja.moneda == moneda)
    
    # Ordenar por fecha descendente
    query = query.order_by(MovimientoCaja.fecha.desc(), MovimientoCaja.id.desc())
    
    movimientos = query.offset(skip).limit(limit).all()
    return movimientos

@router.get("/resumen", response_model=ResumenCaja)
def get_resumen_caja(
    desde: date = Query(..., description="Fecha de inicio para el resumen"),
    hasta: date = Query(..., description="Fecha de fin para el resumen"),
    db: Session = Depends(get_db)
):
    # Obtener movimientos en el período
    movimientos = db.query(MovimientoCaja).filter(
        MovimientoCaja.fecha >= desde,
        MovimientoCaja.fecha <= hasta
    ).all()
    
    # Inicializar contadores
    total_ingresos_pesos = 0.0
    total_egresos_pesos = 0.0
    total_ingresos_usd = 0.0
    total_egresos_usd = 0.0
    
    # Contadores por socio
    socios_data = {socio.value: {"ingresos_pesos": 0.0, "egresos_pesos": 0.0, "ingresos_usd": 0.0, "egresos_usd": 0.0} 
                   for socio in SocioEnum}
    
    # Contadores por categoría
    categorias_data = {}
    
    # Procesar movimientos
    for mov in movimientos:
        # Categoría
        if mov.categoria.nombre not in categorias_data:
            categorias_data[mov.categoria.nombre] = 0.0
        
        if mov.moneda == MonedaEnum.PESOS:
            # Sumar al total general
            if mov.tipo == TipoMovimientoEnum.INGRESO:
                total_ingresos_pesos += mov.monto
                socios_data[mov.socio]["ingresos_pesos"] += mov.monto
            else:
                total_egresos_pesos += mov.monto
                socios_data[mov.socio]["egresos_pesos"] += mov.monto
            
            # Sumar a la categoría
            categorias_data[mov.categoria.nombre] += mov.monto if mov.tipo == TipoMovimientoEnum.INGRESO else -mov.monto
        else:  # USD
            monto_pesos = mov.monto * mov.tipo_cambio
            
            # Sumar al total general
            if mov.tipo == TipoMovimientoEnum.INGRESO:
                total_ingresos_usd += mov.monto
                socios_data[mov.socio]["ingresos_usd"] += mov.monto
            else:
                total_egresos_usd += mov.monto
                socios_data[mov.socio]["egresos_usd"] += mov.monto
            
            # Sumar a la categoría (convertido a pesos)
            categorias_data[mov.categoria.nombre] += monto_pesos if mov.tipo == TipoMovimientoEnum.INGRESO else -monto_pesos
    
    # Calcular balances
    balance_pesos = total_ingresos_pesos - total_egresos_pesos
    balance_usd = total_ingresos_usd - total_egresos_usd
    
    return ResumenCaja(
        fecha_inicio=desde,
        fecha_fin=hasta,
        total_ingresos_pesos=total_ingresos_pesos,
        total_egresos_pesos=total_egresos_pesos,
        balance_pesos=balance_pesos,
        total_ingresos_usd=total_ingresos_usd,
        total_egresos_usd=total_egresos_usd,
        balance_usd=balance_usd,
        desglose_por_socio=socios_data,
        desglose_por_categoria=categorias_data
    )

@router.get("/resumen-mensual", response_model=List[ResumenMensual])
def get_resumen_mensual(
    anio: int = Query(..., description="Año para el resumen"),
    db: Session = Depends(get_db)
):
    resultados = []
    
    # Para cada mes del año
    for mes in range(1, 13):
        # Obtener el primer y último día del mes
        primer_dia = date(anio, mes, 1)
        if mes == 12:
            ultimo_dia = date(anio + 1, 1, 1) - timedelta(days=1)
        else:
            ultimo_dia = date(anio, mes + 1, 1) - timedelta(days=1)
        
        # Obtener movimientos del mes
        movimientos = db.query(MovimientoCaja).filter(
            MovimientoCaja.fecha >= primer_dia,
            MovimientoCaja.fecha <= ultimo_dia
        ).all()
        
        # Inicializar contadores
        total_ingresos_pesos = 0.0
        total_egresos_pesos = 0.0
        
        # Contar reservas del mes
        from ...models import Reserva
        reservas_count = db.query(func.count(Reserva.id)).filter(
            func.extract('year', Reserva.fecha_ingreso) == anio,
            func.extract('month', Reserva.fecha_ingreso) == mes
        ).scalar()
        
        # Procesar movimientos
        for mov in movimientos:
            if mov.moneda == MonedaEnum.PESOS:
                if mov.tipo == TipoMovimientoEnum.INGRESO:
                    total_ingresos_pesos += mov.monto
                else:
                    total_egresos_pesos += mov.monto
            else:  # USD
                monto_pesos = mov.monto * mov.tipo_cambio
                if mov.tipo == TipoMovimientoEnum.INGRESO:
                    total_ingresos_pesos += monto_pesos
                else:
                    total_egresos_pesos += monto_pesos
        
        # Calcular balance
        balance_pesos = total_ingresos_pesos - total_egresos_pesos
        
        resultados.append(ResumenMensual(
            mes=mes,
            anio=anio,
            total_ingresos_pesos=total_ingresos_pesos,
            total_egresos_pesos=total_egresos_pesos,
            balance_pesos=balance_pesos,
            reservas_total=reservas_count
        ))
    
    return resultados

@router.get("/{movimiento_id}", response_model=MovimientoCajaWithRelaciones)
def read_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    movimiento = db.query(MovimientoCaja).filter(MovimientoCaja.id == movimiento_id).first()
    if movimiento is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    return movimiento

@router.put("/{movimiento_id}", response_model=MovimientoCajaInDB)
def update_movimiento(movimiento_id: int, movimiento: MovimientoCajaUpdate, db: Session = Depends(get_db)):
    db_movimiento = db.query(MovimientoCaja).filter(MovimientoCaja.id == movimiento_id).first()
    if db_movimiento is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    # Si se actualiza la categoría, verificar que exista y que el tipo coincida
    if movimiento.categoria_id is not None:
        db_categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.id == movimiento.categoria_id).first()
        if not db_categoria:
            raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
        # Si también se actualiza el tipo, verificar que coincida con la categoría
        if movimiento.tipo is not None and movimiento.tipo != db_categoria.tipo:
            raise HTTPException(
                status_code=400, 
                detail=f"El tipo de movimiento debe ser {db_categoria.tipo} para la categoría seleccionada"
            )
        # Si no se actualiza el tipo, verificar que el tipo actual coincida con la categoría
        elif movimiento.tipo is None and db_movimiento.tipo != db_categoria.tipo:
            raise HTTPException(
                status_code=400, 
                detail=f"El tipo de movimiento debe ser {db_categoria.tipo} para la categoría seleccionada"
            )
    
    # Si se actualiza a USD, el tipo de cambio es obligatorio
    nueva_moneda = movimiento.moneda or db_movimiento.moneda
    nuevo_tipo_cambio = movimiento.tipo_cambio if movimiento.tipo_cambio is not None else db_movimiento.tipo_cambio
    
    if nueva_moneda == MonedaEnum.DOLARES and nuevo_tipo_cambio is None:
        raise HTTPException(
            status_code=400,
            detail="El tipo de cambio es obligatorio para movimientos en dólares"
        )
    
    update_data = movimiento.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_movimiento, key, value)
    
    db.commit()
    db.refresh(db_movimiento)
    return db_movimiento

@router.delete("/{movimiento_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movimiento(movimiento_id: int, db: Session = Depends(get_db)):
    db_movimiento = db.query(MovimientoCaja).filter(MovimientoCaja.id == movimiento_id).first()
    if db_movimiento is None:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")
    
    db.delete(db_movimiento)
    db.commit()
    return None
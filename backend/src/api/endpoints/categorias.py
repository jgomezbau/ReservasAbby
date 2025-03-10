from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...db.database import get_db
from ...models import CategoriaMovimiento, TipoMovimientoEnum
from ...schemas import CategoriaMovimientoCreate, CategoriaMovimientoUpdate, CategoriaMovimientoInDB

router = APIRouter()

@router.post("/", response_model=CategoriaMovimientoInDB, status_code=status.HTTP_201_CREATED)
def create_categoria(categoria: CategoriaMovimientoCreate, db: Session = Depends(get_db)):
    # Verificar que no exista una categoría con el mismo nombre
    db_categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.nombre == categoria.nombre).first()
    if db_categoria:
        raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    
    db_categoria = CategoriaMovimiento(**categoria.dict())
    db.add(db_categoria)
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

@router.get("/", response_model=List[CategoriaMovimientoInDB])
def read_categorias(
    skip: int = 0, 
    limit: int = 100, 
    tipo: TipoMovimientoEnum = None,
    db: Session = Depends(get_db)
):
    query = db.query(CategoriaMovimiento)
    
    if tipo:
        query = query.filter(CategoriaMovimiento.tipo == tipo)
    
    categorias = query.order_by(CategoriaMovimiento.nombre).offset(skip).limit(limit).all()
    return categorias

@router.get("/{categoria_id}", response_model=CategoriaMovimientoInDB)
def read_categoria(categoria_id: int, db: Session = Depends(get_db)):
    categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.id == categoria_id).first()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return categoria

@router.put("/{categoria_id}", response_model=CategoriaMovimientoInDB)
def update_categoria(categoria_id: int, categoria: CategoriaMovimientoUpdate, db: Session = Depends(get_db)):
    db_categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.id == categoria_id).first()
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Si se actualiza el nombre, verificar que no exista otra categoría con ese nombre
    if categoria.nombre and categoria.nombre != db_categoria.nombre:
        existing = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.nombre == categoria.nombre).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe una categoría con ese nombre")
    
    update_data = categoria.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_categoria, key, value)
    
    db.commit()
    db.refresh(db_categoria)
    return db_categoria

@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(categoria_id: int, db: Session = Depends(get_db)):
    db_categoria = db.query(CategoriaMovimiento).filter(CategoriaMovimiento.id == categoria_id).first()
    if db_categoria is None:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar si hay movimientos asociados a esta categoría
    if db_categoria.movimientos:
        raise HTTPException(
            status_code=400, 
            detail="No se puede eliminar la categoría porque tiene movimientos asociados"
        )
    
    db.delete(db_categoria)
    db.commit()
    return None
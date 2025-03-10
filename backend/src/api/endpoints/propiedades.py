from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...db.database import get_db
from ...models import Propiedad
from ...schemas import PropiedadCreate, PropiedadUpdate, PropiedadInDB

router = APIRouter()

@router.post("/", response_model=PropiedadInDB, status_code=status.HTTP_201_CREATED)
def create_propiedad(propiedad: PropiedadCreate, db: Session = Depends(get_db)):
    db_propiedad = Propiedad(**propiedad.dict())
    db.add(db_propiedad)
    db.commit()
    db.refresh(db_propiedad)
    return db_propiedad

@router.get("/", response_model=List[PropiedadInDB])
def read_propiedades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    propiedades = db.query(Propiedad).offset(skip).limit(limit).all()
    return propiedades

@router.get("/{propiedad_id}", response_model=PropiedadInDB)
def read_propiedad(propiedad_id: int, db: Session = Depends(get_db)):
    propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if propiedad is None:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return propiedad

@router.put("/{propiedad_id}", response_model=PropiedadInDB)
def update_propiedad(propiedad_id: int, propiedad: PropiedadUpdate, db: Session = Depends(get_db)):
    db_propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if db_propiedad is None:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    update_data = propiedad.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_propiedad, key, value)
    
    db.commit()
    db.refresh(db_propiedad)
    return db_propiedad

@router.delete("/{propiedad_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_propiedad(propiedad_id: int, db: Session = Depends(get_db)):
    db_propiedad = db.query(Propiedad).filter(Propiedad.id == propiedad_id).first()
    if db_propiedad is None:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    db.delete(db_propiedad)
    db.commit()
    return None
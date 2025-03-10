from fastapi import APIRouter
from .endpoints import propiedades, reservas, categorias, caja, integraciones

api_router = APIRouter()

api_router.include_router(propiedades.router, prefix="/propiedades", tags=["propiedades"])
api_router.include_router(reservas.router, prefix="/reservas", tags=["reservas"])
api_router.include_router(categorias.router, prefix="/categorias", tags=["categorias"])
api_router.include_router(caja.router, prefix="/caja", tags=["caja"])
api_router.include_router(integraciones.router, prefix="/integraciones", tags=["integraciones"])
import axios from 'axios';

// Configuración base de axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response ? error.response.data : error);
    return Promise.reject(error);
  }
);

// Servicios para propiedades
export const propiedadesService = {
  getAll: () => api.get('/propiedades'),
  getById: (id) => api.get(`/propiedades/${id}`),
  create: (data) => api.post('/propiedades', data),
  update: (id, data) => api.put(`/propiedades/${id}`, data),
  delete: (id) => api.delete(`/propiedades/${id}`),
};

// Servicios para reservas
export const reservasService = {
  getAll: (params) => api.get('/reservas', { params }),
  getById: (id) => api.get(`/reservas/${id}`),
  create: (data) => api.post('/reservas', data),
  update: (id, data) => api.put(`/reservas/${id}`, data),
  delete: (id) => api.delete(`/reservas/${id}`),
  getCalendario: (params) => api.get('/reservas/calendario', { params }),
};

// Servicios para categorías
export const categoriasService = {
  getAll: (params) => api.get('/categorias', { params }),
  getById: (id) => api.get(`/categorias/${id}`),
  create: (data) => api.post('/categorias', data),
  update: (id, data) => api.put(`/categorias/${id}`, data),
  delete: (id) => api.delete(`/categorias/${id}`),
};

// Servicios para movimientos de caja
export const cajaService = {
  getAll: (params) => api.get('/caja', { params }),
  getById: (id) => api.get(`/caja/${id}`),
  create: (data) => api.post('/caja', data),
  update: (id, data) => api.put(`/caja/${id}`, data),
  delete: (id) => api.delete(`/caja/${id}`),
  getResumen: (params) => api.get('/caja/resumen', { params }),
  getResumenMensual: (params) => api.get('/caja/resumen-mensual', { params }),
};

// Servicios para integraciones
export const integracionesService = {
  syncAirbnb: (data) => api.post('/integraciones/airbnb/sync', data),
  syncBooking: (data) => api.post('/integraciones/booking/sync', data),
  importarExcel: (data) => api.post('/integraciones/importar-excel', data),
};

export default api;
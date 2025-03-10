import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

// Importar páginas
import Dashboard from './pages/Dashboard';
import PropiedadesPage from './pages/propiedades/PropiedadesPage';
import PropiedadDetalle from './pages/propiedades/PropiedadDetalle';
import ReservasPage from './pages/reservas/ReservasPage';
import ReservaDetalle from './pages/reservas/ReservaDetalle';
import CalendarioPage from './pages/calendario/CalendarioPage';
import CajaPage from './pages/caja/CajaPage';
import CategoriasPage from './pages/categorias/CategoriasPage';
import SincronizarPage from './pages/sincronizar/SincronizarPage';
import ConfiguracionPage from './pages/configuracion/ConfiguracionPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        
        <Route path="/propiedades" element={<PropiedadesPage />} />
        <Route path="/propiedades/:id" element={<PropiedadDetalle />} />
        
        <Route path="/reservas" element={<ReservasPage />} />
        <Route path="/reservas/:id" element={<ReservaDetalle />} />
        
        <Route path="/calendario" element={<CalendarioPage />} />
        
        <Route path="/caja" element={<CajaPage />} />
        
        <Route path="/categorias" element={<CategoriasPage />} />
        
        <Route path="/sincronizar" element={<SincronizarPage />} />
        
        <Route path="/configuracion" element={<ConfiguracionPage />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
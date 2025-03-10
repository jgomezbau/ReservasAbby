import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Button,
  Box
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cajaService, reservasService } from '../services/api';

const Dashboard = () => {
  const [resumenMensual, setResumenMensual] = useState([]);
  const [reservasProximas, setReservasProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estilo para las tarjetas
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener el año actual
        const currentYear = new Date().getFullYear();
        
        // Obtener resumen mensual del año actual
        const resumenResponse = await cajaService.getResumenMensual({ anio: currentYear });
        
        // Formatear datos para el gráfico
        const formattedResumen = resumenResponse.data.map(mes => ({
          ...mes,
          nombre: format(new Date(mes.anio, mes.mes - 1), 'MMMM', { locale: es }),
          balance: mes.balance_pesos
        }));
        
        setResumenMensual(formattedResumen);
        
        // Obtener próximas reservas
        const hoy = new Date();
        const reservasResponse = await reservasService.getAll({
          desde: format(hoy, 'yyyy-MM-dd'),
          limit: 5
        });
        
        setReservasProximas(reservasResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos. Por favor, intenta de nuevo más tarde.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#ffebee' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Tarjetas informativas */}
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" component="div">
                Reservas Totales (este mes)
              </Typography>
              <Typography variant="h3" component="div" sx={{ my: 2 }}>
                {loading ? '...' : (resumenMensual[new Date().getMonth()]?.reservas_total || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" component="div">
                Ingresos (este mes)
              </Typography>
              <Typography variant="h3" component="div" sx={{ my: 2 }}>
                ${loading ? '...' : (resumenMensual[new Date().getMonth()]?.total_ingresos_pesos || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={cardStyle}>
            <CardContent>
              <Typography variant="h6" component="div">
                Balance (este mes)
              </Typography>
              <Typography variant="h3" component="div" sx={{ my: 2 }}>
                ${loading ? '...' : (resumenMensual[new Date().getMonth()]?.balance_pesos || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Gráfico de ingresos y egresos por mes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ingresos y Egresos por Mes
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={resumenMensual}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="total_ingresos_pesos" name="Ingresos" fill="#82ca9d" />
                <Bar dataKey="total_egresos_pesos" name="Egresos" fill="#ff8042" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Gráfico de balance por mes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Balance Mensual
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={resumenMensual}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="balance_pesos" name="Balance" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        {/* Próximas reservas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Próximas Reservas
            </Typography>
            {loading ? (
              <Typography>Cargando próximas reservas...</Typography>
            ) : reservasProximas.length > 0 ? (
              <Box>
                {reservasProximas.map((reserva) => (
                  <Box 
                    key={reserva.id} 
                    sx={{ 
                      mb: 1.5, 
                      p: 1.5, 
                      border: '1px solid #eee',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle1">
                      {reserva.nombre_huesped} - {reserva.propiedad.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(new Date(reserva.fecha_ingreso), 'dd/MM/yyyy')} - {format(new Date(reserva.fecha_salida), 'dd/MM/yyyy')}
                    </Typography>
                    <Typography variant="body2">
                      Plataforma: {reserva.plataforma} | Total: USD ${reserva.monto_total_usd}
                    </Typography>
                  </Box>
                ))}
                <Button sx={{ mt: 1 }} href="/reservas" variant="outlined">
                  Ver todas las reservas
                </Button>
              </Box>
            ) : (
              <Typography>No hay reservas próximas</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
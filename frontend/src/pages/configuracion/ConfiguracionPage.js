import React from 'react';
import {
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListSubheader,
  Switch,
  FormGroup,
  FormControlLabel,
  Box,
  TextField,
  Button,
  Alert,
  Snackbar
} from '@mui/material';

const ConfiguracionPage = () => {
  const [settings, setSettings] = React.useState({
    notificaciones: false,
    temaOscuro: false,
    dolaresComoPredeterminado: true,
    mostrarEstadisticas: true,
    diasAnticipacionAlerta: 7,
    apiKey: {
      airbnb: '',
      booking: ''
    }
  });

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');

  // Manejar cambios en los switches
  const handleSwitchChange = (event) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });
  };

  // Manejar cambios en los campos de texto
  const handleTextChange = (event) => {
    if (event.target.name === 'diasAnticipacionAlerta') {
      setSettings({
        ...settings,
        [event.target.name]: parseInt(event.target.value, 10) || 0
      });
    } else if (event.target.name.startsWith('api_')) {
      const platform = event.target.name.split('_')[1];
      setSettings({
        ...settings,
        apiKey: {
          ...settings.apiKey,
          [platform]: event.target.value
        }
      });
    }
  };

  // Guardar configuración
  const handleSaveSettings = () => {
    // En una implementación real, aquí guardaríamos la configuración en el backend
    console.log('Guardando configuración:', settings);
    setSnackbarMessage('Configuración guardada correctamente');
    setOpenSnackbar(true);
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Configuración
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Preferencias Generales
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.notificaciones}
                onChange={handleSwitchChange}
                name="notificaciones"
              />
            }
            label="Activar notificaciones"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.temaOscuro}
                onChange={handleSwitchChange}
                name="temaOscuro"
              />
            }
            label="Usar tema oscuro"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.dolaresComoPredeterminado}
                onChange={handleSwitchChange}
                name="dolaresComoPredeterminado"
              />
            }
            label="Mostrar precios en dólares por defecto"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.mostrarEstadisticas}
                onChange={handleSwitchChange}
                name="mostrarEstadisticas"
              />
            }
            label="Mostrar estadísticas en el dashboard"
          />
        </FormGroup>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="Días de anticipación para alertas"
            type="number"
            name="diasAnticipacionAlerta"
            value={settings.diasAnticipacionAlerta}
            onChange={handleTextChange}
            fullWidth
            margin="normal"
            helperText="Número de días antes de una reserva para mostrar alertas"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Configuración de APIs
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="info" sx={{ mb: 2 }}>
          Para sincronizar automáticamente las reservas, necesitas configurar las claves de API de las plataformas.
        </Alert>

        <Box sx={{ mt: 2 }}>
          <TextField
            label="API Key de Airbnb"
            name="api_airbnb"
            value={settings.apiKey.airbnb}
            onChange={handleTextChange}
            fullWidth
            margin="normal"
            type="password"
            helperText="Obtén tu API Key en la configuración de cuenta de Airbnb"
          />

          <TextField
            label="API Key de Booking"
            name="api_booking"
            value={settings.apiKey.booking}
            onChange={handleTextChange}
            fullWidth
            margin="normal"
            type="password"
            helperText="Obtén tu API Key en la configuración de cuenta de Booking"
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Socios
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <List subheader={<ListSubheader>Usuarios con acceso al sistema</ListSubheader>}>
          <ListItem>
            <ListItemText primary="Maxy" secondary="Administrador" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Oso" secondary="Administrador" />
          </ListItem>
          <ListItem>
            <ListItemText primary="Laura" secondary="Administrador" />
          </ListItem>
        </List>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, mb: 5 }}>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleSaveSettings}
        >
          Guardar Configuración
        </Button>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default ConfiguracionPage;
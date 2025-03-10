import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid,
  Card, 
  CardContent, 
  CardActions,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { propiedadesService } from '../../services/api';

const PropiedadesPage = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPropiedad, setCurrentPropiedad] = useState({ nombre: '', descripcion: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [propiedadToDelete, setPropiedadToDelete] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // Cargar propiedades al iniciar
  useEffect(() => {
    fetchPropiedades();
  }, []);

  const fetchPropiedades = async () => {
    try {
      setLoading(true);
      const response = await propiedadesService.getAll();
      setPropiedades(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
      setError('Error al cargar las propiedades');
      setLoading(false);
    }
  };

  // Abrir diálogo para crear nueva propiedad
  const handleOpenCreateDialog = () => {
    setCurrentPropiedad({ nombre: '', descripcion: '' });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Abrir diálogo para editar propiedad existente
  const handleOpenEditDialog = (propiedad) => {
    setCurrentPropiedad(propiedad);
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPropiedad(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar propiedad (crear o actualizar)
  const handleSavePropiedad = async () => {
    try {
      if (isEditing) {
        // Actualizar propiedad existente
        await propiedadesService.update(currentPropiedad.id, currentPropiedad);
        setSnackbarMessage('Propiedad actualizada correctamente');
      } else {
        // Crear nueva propiedad
        await propiedadesService.create(currentPropiedad);
        setSnackbarMessage('Propiedad creada correctamente');
      }
      
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchPropiedades(); // Recargar propiedades
    } catch (err) {
      console.error('Error al guardar la propiedad:', err);
      setSnackbarMessage('Error al guardar la propiedad');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteConfirm = (propiedad) => {
    setPropiedadToDelete(propiedad);
    setOpenConfirmDialog(true);
  };

  // Cerrar diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setPropiedadToDelete(null);
  };

  // Eliminar propiedad
  const handleDeletePropiedad = async () => {
    try {
      await propiedadesService.delete(propiedadToDelete.id);
      setSnackbarMessage('Propiedad eliminada correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      handleCloseConfirmDialog();
      fetchPropiedades(); // Recargar propiedades
    } catch (err) {
      console.error('Error al eliminar la propiedad:', err);
      setSnackbarMessage('Error al eliminar la propiedad. Es posible que tenga reservas asociadas.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      handleCloseConfirmDialog();
    }
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Propiedades
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Agregar Propiedad
        </Button>
      </Box>

      {loading ? (
        <Typography>Cargando propiedades...</Typography>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Grid container spacing={3}>
          {propiedades.map((propiedad) => (
            <Grid item xs={12} sm={6} md={4} key={propiedad.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={`https://source.unsplash.com/random/300x200/?apartment&${propiedad.id}`}
                  alt={propiedad.nombre}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="div">
                    {propiedad.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {propiedad.descripcion || 'Sin descripción'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" href={`/propiedades/${propiedad.id}`}>Ver Detalles</Button>
                  <IconButton 
                    aria-label="edit" 
                    onClick={() => handleOpenEditDialog(propiedad)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    aria-label="delete" 
                    onClick={() => handleOpenDeleteConfirm(propiedad)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo para crear/editar propiedad */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{isEditing ? 'Editar Propiedad' : 'Crear Nueva Propiedad'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="nombre"
            name="nombre"
            label="Nombre de la Propiedad"
            type="text"
            fullWidth
            variant="outlined"
            value={currentPropiedad.nombre}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            id="descripcion"
            name="descripcion"
            label="Descripción"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={currentPropiedad.descripcion || ''}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSavePropiedad} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la propiedad "{propiedadToDelete?.nombre}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
          <Button onClick={handleDeletePropiedad} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default PropiedadesPage;
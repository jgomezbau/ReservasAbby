import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Grid,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { reservasService, propiedadesService } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const ReservasPage = () => {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [filtrosDialog, setFiltrosDialog] = useState(false);
  const [currentReserva, setCurrentReserva] = useState({
    fecha_ingreso: null,
    fecha_salida: null,
    nombre_huesped: '',
    plataforma: '',
    estado: 'PENDIENTE',
    monto_total_usd: '',
    monto_sena_usd: '',
    notas: '',
    propiedad_id: ''
  });
  const [filtros, setFiltros] = useState({
    desde: null,
    hasta: null,
    propiedad_id: '',
    plataforma: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [reservaToDelete, setReservaToDelete] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Opciones para los selects
  const plataformasOptions = [
    { value: 'Airbnb', label: 'Airbnb' },
    { value: 'Booking', label: 'Booking' },
    { value: 'Particular', label: 'Particular' },
    { value: 'Otro', label: 'Otro' }
  ];

  const estadosOptions = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'CONFIRMADA', label: 'Confirmada' },
    { value: 'CANCELADA', label: 'Cancelada' },
    { value: 'COMPLETADA', label: 'Completada' }
  ];

  // Definir columnas para la tabla
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'propiedad',
      headerName: 'Propiedad',
      width: 150,
      valueGetter: (params) => params.row.propiedad?.nombre || ''
    },
    { field: 'nombre_huesped', headerName: 'Huésped', width: 150 },
    {
      field: 'fecha_ingreso',
      headerName: 'Check-in',
      width: 120,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy')
    },
    {
      field: 'fecha_salida',
      headerName: 'Check-out',
      width: 120,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy')
    },
    { field: 'plataforma', headerName: 'Plataforma', width: 120 },
    {
      field: 'monto_total_usd',
      headerName: 'Monto Total (USD)',
      width: 150,
      valueFormatter: (params) => `$${params.value.toLocaleString()}`
    },
    {
      field: 'estado',
      headerName: 'Estado',
      width: 120
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => navigate(`/reservas/${params.row.id}`)}
            size="small"
            color="primary"
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => handleOpenEditDialog(params.row)}
            size="small"
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={() => handleOpenDeleteConfirm(params.row)}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Cargar datos al inicio
  useEffect(() => {
    fetchPropiedades();
    fetchReservas();
  }, []);

  // Cargar propiedades
  const fetchPropiedades = async () => {
    try {
      const response = await propiedadesService.getAll();
      setPropiedades(response.data);
    } catch (err) {
      console.error('Error al cargar propiedades:', err);
    }
  };

  // Cargar reservas con filtros
  const fetchReservas = async (filters = {}) => {
    try {
      setLoading(true);
      
      const params = { ...filters };
      if (params.desde) params.desde = format(params.desde, 'yyyy-MM-dd');
      if (params.hasta) params.hasta = format(params.hasta, 'yyyy-MM-dd');
      
      const response = await reservasService.getAll(params);
      setReservas(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      setLoading(false);
    }
  };

  // Abrir diálogo de filtros
  const handleOpenFiltrosDialog = () => {
    setFiltrosDialog(true);
  };

  // Cerrar diálogo de filtros
  const handleCloseFiltrosDialog = () => {
    setFiltrosDialog(false);
  };

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    fetchReservas(filtros);
    setFiltrosDialog(false);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      desde: null,
      hasta: null,
      propiedad_id: '',
      plataforma: ''
    });
    fetchReservas({});
    setFiltrosDialog(false);
  };

  // Abrir diálogo para crear nueva reserva
  const handleOpenCreateDialog = () => {
    setCurrentReserva({
      fecha_ingreso: null,
      fecha_salida: null,
      nombre_huesped: '',
      plataforma: 'Airbnb',
      estado: 'PENDIENTE',
      monto_total_usd: '',
      monto_sena_usd: '',
      notas: '',
      propiedad_id: propiedades.length > 0 ? propiedades[0].id : ''
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Abrir diálogo para editar reserva existente
  const handleOpenEditDialog = (reserva) => {
    setCurrentReserva({
      ...reserva,
      fecha_ingreso: new Date(reserva.fecha_ingreso),
      fecha_salida: new Date(reserva.fecha_salida)
    });
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
    setCurrentReserva(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en fechas
  const handleDateChange = (name, value) => {
    setCurrentReserva(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en fechas de filtros
  const handleFiltroDateChange = (name, value) => {
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar reserva (crear o actualizar)
  const handleSaveReserva = async () => {
    try {
      // Validar fechas
      if (!currentReserva.fecha_ingreso || !currentReserva.fecha_salida) {
        setSnackbarMessage('Las fechas de ingreso y salida son obligatorias');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      // Validar monto total
      if (!currentReserva.monto_total_usd || isNaN(currentReserva.monto_total_usd)) {
        setSnackbarMessage('El monto total es obligatorio y debe ser un número');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const reservaData = {
        ...currentReserva,
        fecha_ingreso: format(currentReserva.fecha_ingreso, 'yyyy-MM-dd'),
        fecha_salida: format(currentReserva.fecha_salida, 'yyyy-MM-dd'),
        monto_total_usd: parseFloat(currentReserva.monto_total_usd),
        monto_sena_usd: currentReserva.monto_sena_usd ? parseFloat(currentReserva.monto_sena_usd) : null
      };

      if (isEditing) {
        // Actualizar reserva existente
        await reservasService.update(currentReserva.id, reservaData);
        setSnackbarMessage('Reserva actualizada correctamente');
      } else {
        // Crear nueva reserva
        await reservasService.create(reservaData);
        setSnackbarMessage('Reserva creada correctamente');
      }
      
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchReservas(filtros); // Recargar reservas con filtros actuales
    } catch (err) {
      console.error('Error al guardar la reserva:', err);
      setSnackbarMessage(
        err.response?.data?.detail || 'Error al guardar la reserva'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteConfirm = (reserva) => {
    setReservaToDelete(reserva);
    setOpenConfirmDialog(true);
  };

  // Cerrar diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setReservaToDelete(null);
  };

  // Eliminar reserva
  const handleDeleteReserva = async () => {
    try {
      await reservasService.delete(reservaToDelete.id);
      setSnackbarMessage('Reserva eliminada correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      handleCloseConfirmDialog();
      fetchReservas(filtros); // Recargar reservas con filtros actuales
    } catch (err) {
      console.error('Error al eliminar la reserva:', err);
      setSnackbarMessage('Error al eliminar la reserva');
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Reservas
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<FilterAltIcon />}
              onClick={handleOpenFiltrosDialog}
              sx={{ mr: 2 }}
            >
              Filtros
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              Nueva Reserva
            </Button>
          </Box>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <DataGrid
            rows={reservas}
            columns={columns}
            loading={loading}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            autoHeight
            disableRowSelectionOnClick
            pageSizeOptions={[5, 10, 25]}
          />
        </Paper>

        {/* Diálogo de filtros */}
        <Dialog open={filtrosDialog} onClose={handleCloseFiltrosDialog}>
          <DialogTitle>Filtrar Reservas</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Desde"
                  value={filtros.desde}
                  onChange={(newValue) => handleFiltroDateChange('desde', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Hasta"
                  value={filtros.hasta}
                  onChange={(newValue) => handleFiltroDateChange('hasta', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-propiedad-label">Propiedad</InputLabel>
                  <Select
                    labelId="filtro-propiedad-label"
                    id="filtro-propiedad"
                    name="propiedad_id"
                    value={filtros.propiedad_id}
                    onChange={handleFiltroChange}
                    label="Propiedad"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {propiedades.map((propiedad) => (
                      <MenuItem key={propiedad.id} value={propiedad.id}>
                        {propiedad.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-plataforma-label">Plataforma</InputLabel>
                  <Select
                    labelId="filtro-plataforma-label"
                    id="filtro-plataforma"
                    name="plataforma"
                    value={filtros.plataforma}
                    onChange={handleFiltroChange}
                    label="Plataforma"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {plataformasOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLimpiarFiltros}>Limpiar</Button>
            <Button onClick={handleCloseFiltrosDialog}>Cancelar</Button>
            <Button onClick={handleAplicarFiltros} variant="contained" color="primary">
              Aplicar Filtros
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para crear/editar reserva */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{isEditing ? 'Editar Reserva' : 'Crear Nueva Reserva'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="propiedad-label">Propiedad</InputLabel>
                  <Select
                    labelId="propiedad-label"
                    id="propiedad_id"
                    name="propiedad_id"
                    value={currentReserva.propiedad_id}
                    onChange={handleInputChange}
                    label="Propiedad"
                    required
                  >
                    {propiedades.map((propiedad) => (
                      <MenuItem key={propiedad.id} value={propiedad.id}>
                        {propiedad.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="nombre_huesped"
                  name="nombre_huesped"
                  label="Nombre del Huésped"
                  fullWidth
                  variant="outlined"
                  value={currentReserva.nombre_huesped}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Ingreso"
                  value={currentReserva.fecha_ingreso}
                  onChange={(newValue) => handleDateChange('fecha_ingreso', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha de Salida"
                  value={currentReserva.fecha_salida}
                  onChange={(newValue) => handleDateChange('fecha_salida', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="plataforma-label">Plataforma</InputLabel>
                  <Select
                    labelId="plataforma-label"
                    id="plataforma"
                    name="plataforma"
                    value={currentReserva.plataforma}
                    onChange={handleInputChange}
                    label="Plataforma"
                    required
                  >
                    {plataformasOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="estado-label">Estado</InputLabel>
                  <Select
                    labelId="estado-label"
                    id="estado"
                    name="estado"
                    value={currentReserva.estado}
                    onChange={handleInputChange}
                    label="Estado"
                    required
                  >
                    {estadosOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  id="monto_total_usd"
                  name="monto_total_usd"
                  label="Monto Total (USD)"
                  fullWidth
                  variant="outlined"
                  type="number"
                  value={currentReserva.monto_total_usd}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  id="monto_sena_usd"
                  name="monto_sena_usd"
                  label="Monto Seña (USD)"
                  fullWidth
                  variant="outlined"
                  type="number"
                  value={currentReserva.monto_sena_usd}
                  onChange={handleInputChange}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="notas"
                  name="notas"
                  label="Notas"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={4}
                  value={currentReserva.notas || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSaveReserva} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar la reserva de "{reservaToDelete?.nombre_huesped}"?
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
            <Button onClick={handleDeleteReserva} variant="contained" color="error">
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
    </LocalizationProvider>
  );
};

export default ReservasPage;
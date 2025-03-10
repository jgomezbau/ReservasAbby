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
  IconButton,
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, isValid } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { DataGrid } from '@mui/x-data-grid';
import { cajaService, categoriasService } from '../../services/api';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// Colores para gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CajaPage = () => {
  // Estados para la gestión de la interfaz
  const [activeTab, setActiveTab] = useState(0);
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false);
  const [filtrosDialog, setFiltrosDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [movimientoToDelete, setMovimientoToDelete] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [resumenCaja, setResumenCaja] = useState(null);
  const [filtrosFechas, setFiltrosFechas] = useState({
    desde: startOfMonth(new Date()),
    hasta: endOfMonth(new Date())
  });
  const [categoriaEdit, setCategoriaEdit] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'INGRESO'
  });

  // Estado para el formulario de movimiento
  const [currentMovimiento, setCurrentMovimiento] = useState({
    fecha: new Date(),
    tipo: 'INGRESO',
    categoria_id: '',
    descripcion: '',
    monto: '',
    moneda: 'ARS',
    tipo_cambio: '',
    socio: 'TODOS',
    relacionado_reserva_id: null
  });

  // Estado para filtros
  const [filtros, setFiltros] = useState({
    desde: startOfMonth(new Date()),
    hasta: endOfMonth(new Date()),
    tipo: '',
    categoria_id: '',
    socio: '',
    moneda: ''
  });

  // Opciones para los selects
  const tipoOptions = [
    { value: 'INGRESO', label: 'Ingreso' },
    { value: 'EGRESO', label: 'Egreso' }
  ];

  const monedaOptions = [
    { value: 'ARS', label: 'Pesos (ARS)' },
    { value: 'USD', label: 'Dólares (USD)' }
  ];

  const socioOptions = [
    { value: 'MAXY', label: 'Maxy' },
    { value: 'OSO', label: 'Oso' },
    { value: 'LAURA', label: 'Laura' },
    { value: 'TODOS', label: 'Todos' }
  ];

  // Definir columnas para la tabla
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'fecha',
      headerName: 'Fecha',
      width: 120,
      valueFormatter: (params) => format(new Date(params.value), 'dd/MM/yyyy')
    },
    {
      field: 'categoria',
      headerName: 'Categoría',
      width: 150,
      valueGetter: (params) => params.row.categoria?.nombre || ''
    },
    { field: 'descripcion', headerName: 'Descripción', width: 200 },
    {
      field: 'monto',
      headerName: 'Monto',
      width: 120,
      valueFormatter: (params) => {
        const symbol = params.row.moneda === 'USD' ? 'US$' : '$';
        return `${symbol} ${params.value.toLocaleString()}`;
      }
    },
    { field: 'moneda', headerName: 'Moneda', width: 100 },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'INGRESO' ? 'success' : 'error'} 
          size="small" 
          variant="outlined"
        />
      )
    },
    { field: 'socio', headerName: 'Socio', width: 120 },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
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

  // Cargar resumen de caja
  const fetchResumen = React.useCallback(async () => {
    if (!filtrosFechas.desde || !filtrosFechas.hasta) return;
    
    try {
      const params = {
        desde: format(filtrosFechas.desde, 'yyyy-MM-dd'),
        hasta: format(filtrosFechas.hasta, 'yyyy-MM-dd')
      };
      
      const response = await cajaService.getResumen(params);
      setResumenCaja(response.data);
    } catch (err) {
      console.error('Error al cargar resumen de caja:', err);
    }
  }, [filtrosFechas]);

  // Cargar datos al inicio
  useEffect(() => {
    fetchCategorias();
    fetchMovimientos();
    fetchResumen();
  }, [fetchResumen]);

  // Cargar datos cuando cambian los filtros de fechas
  useEffect(() => {
    fetchResumen();
  }, [filtrosFechas, fetchResumen]);

  // Cargar categorías
  const fetchCategorias = async () => {
    try {
      const response = await categoriasService.getAll();
      setCategorias(response.data);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  // Cargar movimientos con filtros
  const fetchMovimientos = async (filters = {}) => {
    try {
      setLoading(true);
      
      const params = { ...filters };
      if (params.desde && isValid(params.desde)) params.desde = format(params.desde, 'yyyy-MM-dd');
      if (params.hasta && isValid(params.hasta)) params.hasta = format(params.hasta, 'yyyy-MM-dd');
      
      const response = await cajaService.getAll(params);
      setMovimientos(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar movimientos:', err);
      setLoading(false);
    }
  };

  // Cambiar de pestaña
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    fetchMovimientos(filtros);
    setFiltrosDialog(false);
  };

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltros({
      desde: startOfMonth(new Date()),
      hasta: endOfMonth(new Date()),
      tipo: '',
      categoria_id: '',
      socio: '',
      moneda: ''
    });
    fetchMovimientos({});
    setFiltrosDialog(false);
  };

  // Abrir diálogo para crear nuevo movimiento
  const handleOpenCreateDialog = () => {
    // Establecer valores por defecto para movimiento nuevo
    setCurrentMovimiento({
      fecha: new Date(),
      tipo: 'INGRESO',
      categoria_id: categorias.length > 0 ? categorias.find(cat => cat.tipo === 'INGRESO')?.id || '' : '',
      descripcion: '',
      monto: '',
      moneda: 'ARS',
      tipo_cambio: '',
      socio: 'TODOS',
      relacionado_reserva_id: null
    });
    setIsEditing(false);
    setOpenDialog(true);
  };

  // Abrir diálogo para editar movimiento existente
  const handleOpenEditDialog = (movimiento) => {
    setCurrentMovimiento({
      ...movimiento,
      fecha: new Date(movimiento.fecha)
    });
    setIsEditing(true);
    setOpenDialog(true);
  };

  // Cerrar diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Abrir diálogo para crear/editar categoría
  const handleOpenCategoriaDialog = (categoria = null) => {
    if (categoria) {
      setCategoriaEdit({ ...categoria });
      setIsEditing(true);
    } else {
      setCategoriaEdit({
        nombre: '',
        descripcion: '',
        tipo: 'INGRESO'
      });
      setIsEditing(false);
    }
    setOpenCategoriaDialog(true);
  };

  // Cerrar diálogo de categoría
  const handleCloseCategoriaDialog = () => {
    setOpenCategoriaDialog(false);
  };

  // Manejar cambios en el formulario de movimiento
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentMovimiento(prev => ({
      ...prev,
      [name]: value
    }));

    // Si cambia el tipo, actualizar categoría_id
    if (name === 'tipo') {
      const categoriasDelTipo = categorias.filter(cat => cat.tipo === value);
      if (categoriasDelTipo.length > 0) {
        setCurrentMovimiento(prev => ({
          ...prev,
          tipo: value,
          categoria_id: categoriasDelTipo[0].id
        }));
      }
    }

    // Si cambia moneda a ARS, quitar tipo_cambio
    if (name === 'moneda' && value === 'ARS') {
      setCurrentMovimiento(prev => ({
        ...prev,
        moneda: value,
        tipo_cambio: ''
      }));
    }
  };

  // Manejar cambios en el formulario de categoría
  const handleCategoriaInputChange = (e) => {
    const { name, value } = e.target;
    setCategoriaEdit(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en fechas
  const handleDateChange = (name, value) => {
    setCurrentMovimiento(prev => ({
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

  // Manejar cambios en fechas de resumen
  const handleResumenDateChange = (name, value) => {
    setFiltrosFechas(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar movimiento (crear o actualizar)
  const handleSaveMovimiento = async () => {
    try {
      // Validar fecha
      if (!currentMovimiento.fecha) {
        setSnackbarMessage('La fecha es obligatoria');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      // Validar monto
      if (!currentMovimiento.monto || isNaN(currentMovimiento.monto) || currentMovimiento.monto <= 0) {
        setSnackbarMessage('El monto es obligatorio y debe ser un número mayor a cero');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      // Validar tipo de cambio si es USD
      if (currentMovimiento.moneda === 'USD' && (!currentMovimiento.tipo_cambio || isNaN(currentMovimiento.tipo_cambio))) {
        setSnackbarMessage('El tipo de cambio es obligatorio para movimientos en dólares');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      // Validar categoría
      if (!currentMovimiento.categoria_id) {
        setSnackbarMessage('Debe seleccionar una categoría');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const movimientoData = {
        ...currentMovimiento,
        fecha: format(currentMovimiento.fecha, 'yyyy-MM-dd'),
        monto: parseFloat(currentMovimiento.monto),
        tipo_cambio: currentMovimiento.moneda === 'USD' ? parseFloat(currentMovimiento.tipo_cambio) : null
      };

      if (isEditing) {
        // Actualizar movimiento existente
        await cajaService.update(currentMovimiento.id, movimientoData);
        setSnackbarMessage('Movimiento actualizado correctamente');
      } else {
        // Crear nuevo movimiento
        await cajaService.create(movimientoData);
        setSnackbarMessage('Movimiento creado correctamente');
      }
      
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenDialog(false);
      fetchMovimientos(filtros); // Recargar movimientos con filtros actuales
      fetchResumen(); // Actualizar resumen
    } catch (err) {
      console.error('Error al guardar el movimiento:', err);
      setSnackbarMessage(
        err.response?.data?.detail || 'Error al guardar el movimiento'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Guardar categoría (crear o actualizar)
  const handleSaveCategoria = async () => {
    try {
      // Validar nombre
      if (!categoriaEdit.nombre.trim()) {
        setSnackbarMessage('El nombre de la categoría es obligatorio');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      if (isEditing) {
        // Actualizar categoría existente
        await categoriasService.update(categoriaEdit.id, categoriaEdit);
        setSnackbarMessage('Categoría actualizada correctamente');
      } else {
        // Crear nueva categoría
        await categoriasService.create(categoriaEdit);
        setSnackbarMessage('Categoría creada correctamente');
      }
      
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      setOpenCategoriaDialog(false);
      fetchCategorias(); // Recargar categorías
    } catch (err) {
      console.error('Error al guardar la categoría:', err);
      setSnackbarMessage(
        err.response?.data?.detail || 'Error al guardar la categoría'
      );
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleOpenDeleteConfirm = (movimiento) => {
    setMovimientoToDelete(movimiento);
    setOpenConfirmDialog(true);
  };

  // Cerrar diálogo de confirmación
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setMovimientoToDelete(null);
  };

  // Eliminar movimiento
  const handleDeleteMovimiento = async () => {
    try {
      await cajaService.delete(movimientoToDelete.id);
      setSnackbarMessage('Movimiento eliminado correctamente');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      handleCloseConfirmDialog();
      fetchMovimientos(filtros); // Recargar movimientos con filtros actuales
      fetchResumen(); // Actualizar resumen
    } catch (err) {
      console.error('Error al eliminar el movimiento:', err);
      setSnackbarMessage('Error al eliminar el movimiento');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      handleCloseConfirmDialog();
    }
  };

  // Cerrar snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Preparar datos para gráficos
  const prepareChartData = () => {
    if (!resumenCaja) return [];
    
    // Datos para gráfico de categorías
    const categoriesData = Object.entries(resumenCaja.desglose_por_categoria).map(([key, value]) => ({
      name: key,
      value: Math.abs(value) // Valor absoluto para que se vea bien en el gráfico
    }));
    
    // Ordenar por valor
    categoriesData.sort((a, b) => b.value - a.value);
    
    return categoriesData;
  };

  // Preparar datos para gráfico de barras por socio
  const prepareSociosData = () => {
    if (!resumenCaja) return [];
    
    const sociosData = [];
    
    for (const [socio, data] of Object.entries(resumenCaja.desglose_por_socio)) {
      sociosData.push({
        name: socio,
        ingresos: data.ingresos_pesos,
        egresos: data.egresos_pesos,
        balance: data.ingresos_pesos - data.egresos_pesos
      });
    }
    
    return sociosData;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Gestión de Caja
          </Typography>
          <Box>
            {activeTab === 0 && (
              <>
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
                  Nuevo Movimiento
                </Button>
              </>
            )}
          </Box>
        </Box>

        <Paper sx={{ width: '100%', mb: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
            <Tab label="Movimientos" />
            <Tab label="Resumen" />
            <Tab label="Categorías" />
          </Tabs>
        </Paper>

        {/* Pestaña de Movimientos */}
        {activeTab === 0 && (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <DataGrid
              rows={movimientos}
              columns={columns}
              loading={loading}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10, 25]}
            />
          </Paper>
        )}

        {/* Pestaña de Resumen */}
        {activeTab === 1 && (
          <Box>
            {/* Selectores de fecha para el rango del resumen */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle1">Rango de fechas:</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Desde"
                    value={filtrosFechas.desde}
                    onChange={(newValue) => handleResumenDateChange('desde', newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DatePicker
                    label="Hasta"
                    value={filtrosFechas.hasta}
                    onChange={(newValue) => handleResumenDateChange('hasta', newValue)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Tarjetas de resumen */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Ingresos en Pesos
                    </Typography>
                    <Typography variant="h5" component="div" color="success.main">
                      ${resumenCaja?.total_ingresos_pesos.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Egresos en Pesos
                    </Typography>
                    <Typography variant="h5" component="div" color="error.main">
                      ${resumenCaja?.total_egresos_pesos.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Balance en Pesos
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div" 
                      color={resumenCaja?.balance_pesos >= 0 ? 'success.main' : 'error.main'}
                    >
                      ${resumenCaja?.balance_pesos.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Balance en USD
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div"
                      color={resumenCaja?.balance_usd >= 0 ? 'success.main' : 'error.main'}
                    >
                      US${resumenCaja?.balance_usd.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
              {/* Gráfico de categorías */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Desglose por Categoría
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={prepareChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {prepareChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              {/* Gráfico por socio */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Desglose por Socio
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={prepareSociosData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="ingresos" name="Ingresos" fill="#82ca9d" />
                      <Bar dataKey="egresos" name="Egresos" fill="#ff8042" />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Pestaña de Categorías */}
        {activeTab === 2 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenCategoriaDialog()}
              >
                Nueva Categoría
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Categorías de Ingreso
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {categorias
                    .filter(cat => cat.tipo === 'INGRESO')
                    .map(categoria => (
                      <Grid item xs={12} key={categoria.id}>
                        <Paper sx={{ p: 2, '&:hover': { boxShadow: 3 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1">{categoria.nombre}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {categoria.descripcion || 'Sin descripción'}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => handleOpenCategoriaDialog(categoria)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Categorías de Egreso
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {categorias
                    .filter(cat => cat.tipo === 'EGRESO')
                    .map(categoria => (
                      <Grid item xs={12} key={categoria.id}>
                        <Paper sx={{ p: 2, '&:hover': { boxShadow: 3 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle1">{categoria.nombre}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {categoria.descripcion || 'Sin descripción'}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => handleOpenCategoriaDialog(categoria)}
                              size="small"
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Diálogo de filtros */}
        <Dialog open={filtrosDialog} onClose={handleCloseFiltrosDialog}>
          <DialogTitle>Filtrar Movimientos</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Desde"
                  value={filtros.desde}
                  onChange={(newValue) => handleFiltroDateChange('desde', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Hasta"
                  value={filtros.hasta}
                  onChange={(newValue) => handleFiltroDateChange('hasta', newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="filtro-tipo-label"
                    id="filtro-tipo"
                    name="tipo"
                    value={filtros.tipo}
                    onChange={handleFiltroChange}
                    label="Tipo"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {tipoOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-categoria-label">Categoría</InputLabel>
                  <Select
                    labelId="filtro-categoria-label"
                    id="filtro-categoria"
                    name="categoria_id"
                    value={filtros.categoria_id}
                    onChange={handleFiltroChange}
                    label="Categoría"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map((categoria) => (
                      <MenuItem key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-socio-label">Socio</InputLabel>
                  <Select
                    labelId="filtro-socio-label"
                    id="filtro-socio"
                    name="socio"
                    value={filtros.socio}
                    onChange={handleFiltroChange}
                    label="Socio"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {socioOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="filtro-moneda-label">Moneda</InputLabel>
                  <Select
                    labelId="filtro-moneda-label"
                    id="filtro-moneda"
                    name="moneda"
                    value={filtros.moneda}
                    onChange={handleFiltroChange}
                    label="Moneda"
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {monedaOptions.map((option) => (
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

        {/* Diálogo para crear/editar movimiento */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{isEditing ? 'Editar Movimiento' : 'Nuevo Movimiento'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="tipo-label"
                    id="tipo"
                    name="tipo"
                    value={currentMovimiento.tipo}
                    onChange={handleInputChange}
                    label="Tipo"
                    required
                  >
                    {tipoOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="categoria-label">Categoría</InputLabel>
                  <Select
                    labelId="categoria-label"
                    id="categoria_id"
                    name="categoria_id"
                    value={currentMovimiento.categoria_id}
                    onChange={handleInputChange}
                    label="Categoría"
                    required
                  >
                    {categorias
                      .filter(cat => cat.tipo === currentMovimiento.tipo)
                      .map((categoria) => (
                        <MenuItem key={categoria.id} value={categoria.id}>
                          {categoria.nombre}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Fecha"
                  value={currentMovimiento.fecha}
                  onChange={(newValue) => handleDateChange('fecha', newValue)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="socio-label">Socio</InputLabel>
                  <Select
                    labelId="socio-label"
                    id="socio"
                    name="socio"
                    value={currentMovimiento.socio}
                    onChange={handleInputChange}
                    label="Socio"
                    required
                  >
                    {socioOptions.map((option) => (
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
                  id="monto"
                  name="monto"
                  label="Monto"
                  fullWidth
                  variant="outlined"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  value={currentMovimiento.monto}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="moneda-label">Moneda</InputLabel>
                  <Select
                    labelId="moneda-label"
                    id="moneda"
                    name="moneda"
                    value={currentMovimiento.moneda}
                    onChange={handleInputChange}
                    label="Moneda"
                    required
                  >
                    {monedaOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {currentMovimiento.moneda === 'USD' && (
                <Grid item xs={12} sm={12}>
                  <TextField
                    required
                    id="tipo_cambio"
                    name="tipo_cambio"
                    label="Tipo de Cambio (ARS/USD)"
                    fullWidth
                    variant="outlined"
                    type="number"
                    inputProps={{ step: "0.01", min: "0" }}
                    value={currentMovimiento.tipo_cambio}
                    onChange={handleInputChange}
                    helperText="Valor del dólar en pesos"
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  id="descripcion"
                  name="descripcion"
                  label="Descripción"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={currentMovimiento.descripcion || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSaveMovimiento} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo para crear/editar categoría */}
        <Dialog open={openCategoriaDialog} onClose={handleCloseCategoriaDialog}>
          <DialogTitle>{isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  required
                  id="nombre"
                  name="nombre"
                  label="Nombre"
                  fullWidth
                  variant="outlined"
                  value={categoriaEdit.nombre}
                  onChange={handleCategoriaInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="descripcion"
                  name="descripcion"
                  label="Descripción"
                  fullWidth
                  variant="outlined"
                  multiline
                  rows={2}
                  value={categoriaEdit.descripcion || ''}
                  onChange={handleCategoriaInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="categoria-tipo-label">Tipo</InputLabel>
                  <Select
                    labelId="categoria-tipo-label"
                    id="tipo"
                    name="tipo"
                    value={categoriaEdit.tipo}
                    onChange={handleCategoriaInputChange}
                    label="Tipo"
                    required
                  >
                    {tipoOptions.map((option) => (
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
            <Button onClick={handleCloseCategoriaDialog}>Cancelar</Button>
            <Button onClick={handleSaveCategoria} variant="contained" color="primary">
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar este movimiento?
              Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseConfirmDialog}>Cancelar</Button>
            <Button onClick={handleDeleteMovimiento} variant="contained" color="error">
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

export default CajaPage;
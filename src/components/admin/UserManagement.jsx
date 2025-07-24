import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Search, Edit, Delete, Mail, Key, Shield, Download } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Panel de gestión de usuarios para administradores
 * Permite crear, editar, eliminar y gestionar usuarios
 */
const UserManagement = () => {
  const { currentUser } = useAuth();
  
  // Estado para usuarios y filtros
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Estado para modal de edición
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Cargar usuarios de muestra
  useEffect(() => {
    // En un entorno real, estos datos vendrían de una API
    const mockUsers = [
      {
        id: 1,
        name: 'Ana García',
        email: 'ana.garcia@lovenda.com',
        role: 'admin',
        status: 'active',
        createdAt: '2023-01-15',
        lastLogin: '2023-09-28'
      },
      {
        id: 2,
        name: 'Juan Pérez',
        email: 'juan.perez@lovenda.com',
        role: 'user',
        status: 'active',
        createdAt: '2023-02-05',
        lastLogin: '2023-09-27'
      },
      {
        id: 3,
        name: 'María López',
        email: 'maria.lopez@lovenda.com',
        role: 'provider',
        status: 'active',
        createdAt: '2023-03-12',
        lastLogin: '2023-09-25'
      },
      {
        id: 4,
        name: 'Carlos Ruiz',
        email: 'carlos.ruiz@lovenda.com',
        role: 'user',
        status: 'inactive',
        createdAt: '2023-04-18',
        lastLogin: '2023-08-15'
      },
      {
        id: 5,
        name: 'Laura Fernández',
        email: 'laura.fernandez@lovenda.com',
        role: 'provider',
        status: 'pending',
        createdAt: '2023-05-22',
        lastLogin: null
      },
      {
        id: 6,
        name: 'Pedro Martínez',
        email: 'pedro.martinez@lovenda.com',
        role: 'user',
        status: 'active',
        createdAt: '2023-06-30',
        lastLogin: '2023-09-26'
      }
    ];
    
    setUsers(mockUsers);
    setFilteredUsers(mockUsers);
  }, []);
  
  // Filtrar usuarios
  useEffect(() => {
    let result = users;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por rol
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(result);
  }, [searchTerm, roleFilter, statusFilter, users]);
  
  // Abrir modal de edición
  const handleEditUser = (user) => {
    setSelectedUser({ ...user });
    setOpenEditDialog(true);
  };
  
  // Cerrar modal de edición
  const handleCloseDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
  };
  
  // Guardar cambios de usuario
  const handleSaveUser = () => {
    // Actualizar el usuario en la lista
    setUsers(users.map(user => 
      user.id === selectedUser.id ? selectedUser : user
    ));
    handleCloseDialog();
    
    // En un entorno real, aquí se enviarían los datos a una API
    console.log('Usuario actualizado:', selectedUser);
  };
  
  // Eliminar usuario
  const handleDeleteUser = (userId) => {
    // Confirmar eliminación
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      setUsers(users.filter(user => user.id !== userId));
      
      // En un entorno real, aquí se enviaría la petición a una API
      console.log('Usuario eliminado:', userId);
    }
  };
  
  // Exportar datos de usuarios
  const handleExportUsers = () => {
    // En un entorno real, aquí se generaría un CSV o Excel
    console.log('Exportando datos de usuarios:', filteredUsers);
    alert('Datos de usuarios exportados correctamente');
  };
  
  // Renderizar chip de estado del usuario
  const renderStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'active':
        color = 'success';
        label = 'Activo';
        break;
      case 'inactive':
        color = 'error';
        label = 'Inactivo';
        break;
      case 'pending':
        color = 'warning';
        label = 'Pendiente';
        break;
      default:
        break;
    }
    
    return <Chip label={label} color={color} size="small" />;
  };
  
  // Renderizar chip de rol del usuario
  const renderRoleChip = (role) => {
    let color = 'default';
    let label = role;
    let icon = null;
    
    switch (role) {
      case 'admin':
        color = 'secondary';
        label = 'Administrador';
        icon = <Shield size={14} />;
        break;
      case 'user':
        color = 'primary';
        label = 'Usuario';
        break;
      case 'provider':
        color = 'info';
        label = 'Proveedor';
        break;
      default:
        break;
    }
    
    return (
      <Chip 
        label={label} 
        color={color} 
        size="small"
        icon={icon}
      />
    );
  };
  
  return (
    <Box className="p-6">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1">
          Gestión de Usuarios
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          startIcon={<Download />}
          onClick={handleExportUsers}
        >
          Exportar
        </Button>
      </Box>
      
      {/* Filtros */}
      <Box className="flex flex-col md:flex-row gap-4 mb-6">
        <TextField
          label="Buscar usuario"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search size={20} className="mr-2 text-gray-500" />,
          }}
          className="md:w-1/3"
        />
        
        <FormControl size="small" className="md:w-1/4">
          <InputLabel>Filtrar por rol</InputLabel>
          <Select
            value={roleFilter}
            label="Filtrar por rol"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">Todos los roles</MenuItem>
            <MenuItem value="admin">Administradores</MenuItem>
            <MenuItem value="user">Usuarios</MenuItem>
            <MenuItem value="provider">Proveedores</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" className="md:w-1/4">
          <InputLabel>Filtrar por estado</InputLabel>
          <Select
            value={statusFilter}
            label="Filtrar por estado"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">Todos los estados</MenuItem>
            <MenuItem value="active">Activos</MenuItem>
            <MenuItem value="inactive">Inactivos</MenuItem>
            <MenuItem value="pending">Pendientes</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="outlined"
          onClick={() => {
            setSearchTerm('');
            setRoleFilter('all');
            setStatusFilter('all');
          }}
          className="md:w-1/6"
        >
          Limpiar
        </Button>
      </Box>
      
      {/* Tabla de usuarios */}
      <TableContainer component={Paper} className="mb-4">
        <Table aria-label="tabla de usuarios">
          <TableHead>
            <TableRow>
              <TableCell>Usuario</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Registro</TableCell>
              <TableCell>Último acceso</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box className="flex items-center">
                    <Avatar 
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2">{user.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{renderRoleChip(user.role)}</TableCell>
                <TableCell>{renderStatusChip(user.status)}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {user.lastLogin 
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : 'Nunca'}
                </TableCell>
                <TableCell align="right">
                  <Box className="flex justify-end">
                    <Tooltip title="Enviar email">
                      <IconButton size="small" onClick={() => alert(`Enviar email a ${user.email}`)}>
                        <Mail size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Resetear contraseña">
                      <IconButton size="small" onClick={() => alert(`Resetear contraseña de ${user.name}`)}>
                        <Key size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditUser(user)}>
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Delete size={18} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-8">
                  <Typography variant="body1" color="textSecondary">
                    No se encontraron usuarios con los filtros seleccionados
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Typography variant="body2" color="textSecondary" className="mt-2">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </Typography>
      
      {/* Modal de edición */}
      <Dialog open={openEditDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box className="flex flex-col gap-4 pt-2">
              <TextField
                label="Nombre"
                fullWidth
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
              />
              <TextField
                label="Email"
                fullWidth
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
              />
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={selectedUser.role}
                  label="Rol"
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="user">Usuario</MenuItem>
                  <MenuItem value="provider">Proveedor</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={selectedUser.status}
                  label="Estado"
                  onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})}
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                  <MenuItem value="pending">Pendiente</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Switch 
                    checked={selectedUser.status === 'active'}
                    onChange={(e) => setSelectedUser({
                      ...selectedUser, 
                      status: e.target.checked ? 'active' : 'inactive'
                    })}
                  />
                }
                label="Usuario activo"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

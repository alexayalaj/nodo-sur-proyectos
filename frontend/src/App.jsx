import { Route, Routes } from 'react-router-dom';
import Diseno from './componentes/Diseno.jsx';
import RutaProtegida from './rutas/RutaProtegida.jsx';
import Login from './paginas/Login.jsx';
import Registro from './paginas/Registro.jsx';
import Tablero from './paginas/Tablero.jsx';
import Proyectos from './paginas/Proyectos.jsx';
import ProyectoDetalle from './paginas/ProyectoDetalle.jsx';
import ProyectoForm from './paginas/ProyectoForm.jsx';
import AdminUsuarios from './paginas/AdminUsuarios.jsx';
import SinPermiso from './paginas/SinPermiso.jsx';
import NoEncontrada from './paginas/NoEncontrada.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Diseno />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas que exigen sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="/" element={<Tablero />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/proyectos/nuevo" element={<ProyectoForm />} />
          <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
          <Route path="/proyectos/:id/editar" element={<ProyectoForm />} />
          <Route path="/sin-permiso" element={<SinPermiso />} />
        </Route>

        {/* Rutas solo para administradores */}
        <Route element={<RutaProtegida roles={['admin']} />}>
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
        </Route>

        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}

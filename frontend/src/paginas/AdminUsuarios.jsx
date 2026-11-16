import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useSesion } from '../context/SesionContext.jsx';
import Aviso from '../componentes/Aviso.jsx';
import Cargando from '../componentes/Cargando.jsx';
import EstadoVacio from '../componentes/EstadoVacio.jsx';
import Paginador from '../componentes/Paginador.jsx';

const LIMITE = 8;

export default function AdminUsuarios() {
  const { usuario: yo } = useSesion();
  const [parametros, setParametros] = useSearchParams();
  const pagina = Number(parametros.get('pagina')) || 1;
  const [estado, setEstado] = useState({ cargando: true, error: '', usuarios: [], meta: null });
  const [aviso, setAviso] = useState({ tipo: 'ok', texto: '' });
  const [ocupado, setOcupado] = useState(null);

  const cargar = useCallback(() => {
    let vigente = true;
    api
      .get(`/api/usuarios?pagina=${pagina}&limite=${LIMITE}`)
      .then((r) => vigente && setEstado({ cargando: false, error: '', usuarios: r.data, meta: r.meta }))
      .catch((e) => vigente && setEstado({ cargando: false, error: e.message, usuarios: [], meta: null }));
    return () => { vigente = false; };
  }, [pagina]);

  useEffect(() => {
    document.title = 'Administración de usuarios · Proyectos Nodo Sur';
    return cargar();
  }, [cargar]);

  async function actualizar(u, ruta, cuerpo) {
    setOcupado(u._id);
    setAviso({ tipo: 'ok', texto: '' });
    try {
      const r = await api.patch(`/api/usuarios/${u._id}/${ruta}`, cuerpo);
      setEstado((e) => ({ ...e, usuarios: e.usuarios.map((x) => (x._id === u._id ? r.data : x)) }));
      setAviso({ tipo: 'ok', texto: `${r.message} (${u.nombre})` });
    } catch (err) {
      setAviso({ tipo: 'error', texto: err.message });
    } finally {
      setOcupado(null);
    }
  }

  const { cargando, error, usuarios, meta } = estado;
  return (
    <>
      <h1>Administración de usuarios</h1>
      <p className="intro">Cambia el rol de las personas o desactiva el acceso de una cuenta. Tu propia cuenta no se puede modificar desde aquí.</p>
      <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
      {cargando && <Cargando texto="Cargando usuarios…" />}
      <Aviso tipo="error">{error}</Aviso>
      {!cargando && !error && usuarios.length === 0 && <EstadoVacio titulo="No hay usuarios registrados" />}
      {usuarios.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <caption className="solo-lectores">Usuarios registrados</caption>
            <thead>
              <tr><th scope="col">Nombre</th><th scope="col">Correo</th><th scope="col">Rol</th><th scope="col">Estado</th></tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const esYo = u._id === yo.id;
                return (
                  <tr key={u._id}>
                    <td data-etiqueta="Nombre">{u.nombre}{esYo && <span className="etiqueta-rol"> tú</span>}</td>
                    <td data-etiqueta="Correo">{u.correo}</td>
                    <td data-etiqueta="Rol">
                      <label className="solo-lectores" htmlFor={`rol-${u._id}`}>Rol de {u.nombre}</label>
                      <select id={`rol-${u._id}`} value={u.rol} disabled={esYo || ocupado === u._id} onChange={(e) => actualizar(u, 'rol', { rol: e.target.value })}>
                        <option value="usuario">usuario</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td data-etiqueta="Estado">
                      <span className={`insignia ${u.activo ? 'insignia-completado' : 'insignia-inactivo'}`}>{u.activo ? 'Activo' : 'Desactivado'}</span>{' '}
                      <button type="button" className={`btn-accion ${u.activo ? 'peligro' : ''}`} disabled={esYo || ocupado === u._id} onClick={() => actualizar(u, 'estado', { activo: !u.activo })}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                        <span className="solo-lectores"> a {u.nombre}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <Paginador meta={meta} onCambiar={(p) => setParametros({ pagina: p })} />
    </>
  );
}

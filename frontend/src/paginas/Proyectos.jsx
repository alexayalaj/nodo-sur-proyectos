import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useSesion } from '../context/SesionContext.jsx';
import Aviso from '../componentes/Aviso.jsx';
import Cargando from '../componentes/Cargando.jsx';
import EstadoVacio from '../componentes/EstadoVacio.jsx';
import Filtros from '../componentes/Filtros.jsx';
import Paginador from '../componentes/Paginador.jsx';
import TarjetaProyecto from '../componentes/TarjetaProyecto.jsx';

const LIMITE = 9;

export default function Proyectos() {
  const { esAdmin } = useSesion();
  const [parametros, setParametros] = useSearchParams();
  const [estado, setEstado] = useState({ cargando: true, error: '', proyectos: [], meta: null });
  const [propietarios, setPropietarios] = useState(null);
  const consulta = parametros.toString();

  useEffect(() => { document.title = 'Proyectos · Proyectos Nodo Sur'; }, []);

  // Solo el administrador puede filtrar por propietario
  useEffect(() => {
    if (!esAdmin) return;
    api.get('/api/usuarios?limite=50').then((r) => setPropietarios(r.data)).catch(() => setPropietarios([]));
  }, [esAdmin]);

  useEffect(() => {
    let vigente = true;
    const q = new URLSearchParams(consulta);
    q.set('limite', LIMITE);
    setEstado((e) => ({ ...e, cargando: true, error: '' }));
    api
      .get(`/api/proyectos?${q.toString()}`)
      .then((r) => vigente && setEstado({ cargando: false, error: '', proyectos: r.data, meta: r.meta }))
      .catch((e) => vigente && setEstado({ cargando: false, error: e.message, proyectos: [], meta: null }));
    return () => { vigente = false; };
  }, [consulta]);

  // Cualquier cambio de filtro regresa a la página 1
  const cambiarFiltros = useCallback(
    (cambios) => {
      const siguiente = new URLSearchParams(parametros);
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) siguiente.set(clave, valor); else siguiente.delete(clave);
      }
      siguiente.delete('pagina');
      setParametros(siguiente, { replace: true });
    },
    [parametros, setParametros]
  );
  const irAPagina = (pagina) => {
    const siguiente = new URLSearchParams(parametros);
    siguiente.set('pagina', pagina);
    setParametros(siguiente);
    document.getElementById('contenido')?.focus();
  };

  const { cargando, error, proyectos, meta } = estado;
  const hayFiltros = ['q', 'estado', 'servicio', 'propietario'].some((c) => parametros.get(c));

  return (
    <>
      <div className="barra-herramientas">
        <h1>Proyectos</h1>
        <Link className="btn" to="/proyectos/nuevo">+ Nuevo proyecto</Link>
      </div>
      <Filtros parametros={parametros} onCambiar={cambiarFiltros} propietarios={esAdmin ? propietarios : null} />
      <p className="contador" role="status" aria-live="polite">
        {meta && !cargando ? `${meta.total} ${meta.total === 1 ? 'proyecto' : 'proyectos'}` : ' '}
      </p>
      {cargando && <Cargando texto="Cargando proyectos…" />}
      <Aviso tipo="error">{error}</Aviso>
      {!cargando && !error && proyectos.length === 0 && (
        <EstadoVacio titulo={hayFiltros ? 'Ningún proyecto coincide con los filtros' : 'Aún no hay proyectos'}>
          {hayFiltros ? (
            <button type="button" className="btn-accion" onClick={() => cambiarFiltros({ q: '', estado: '', servicio: '', propietario: '' })}>Limpiar filtros</button>
          ) : (
            <Link className="btn" to="/proyectos/nuevo">Crear proyecto</Link>
          )}
        </EstadoVacio>
      )}
      {proyectos.length > 0 && (
        <ul className="lista" aria-busy={cargando}>
          {proyectos.map((p) => <TarjetaProyecto key={p._id} proyecto={p} mostrarPropietario={esAdmin} />)}
        </ul>
      )}
      <Paginador meta={meta} onCambiar={irAPagina} />
    </>
  );
}

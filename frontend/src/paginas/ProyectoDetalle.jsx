import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/cliente.js';
import Aviso from '../componentes/Aviso.jsx';
import Cargando from '../componentes/Cargando.jsx';
import ConfirmarDialogo from '../componentes/ConfirmarDialogo.jsx';
import ConversorPresupuesto from '../componentes/ConversorPresupuesto.jsx';
import { formatoFecha, formatoMXN } from '../util/formato.js';

export default function ProyectoDetalle() {
  const { id } = useParams(); // ruta dinámica /proyectos/:id
  const navegar = useNavigate();
  const [estado, setEstado] = useState({ cargando: true, error: '', estadoHttp: 0, proyecto: null });
  const [confirmar, setConfirmar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true, error: '', estadoHttp: 0, proyecto: null });
    api
      .get(`/api/proyectos/${id}`)
      .then((r) => {
        if (!vigente) return;
        document.title = `${r.data.nombre} · Proyectos Nodo Sur`;
        setEstado({ cargando: false, error: '', estadoHttp: 200, proyecto: r.data });
      })
      .catch((e) => vigente && setEstado({ cargando: false, error: e.message, estadoHttp: e.estado, proyecto: null }));
    return () => { vigente = false; };
  }, [id]);

  async function eliminar() {
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.eliminar(`/api/proyectos/${id}`);
      navegar('/proyectos', { replace: true });
    } catch (e) {
      setErrorEliminar(e.message);
      setConfirmar(false);
      setEliminando(false);
    }
  }

  const { cargando, error, estadoHttp, proyecto } = estado;
  if (cargando) return <Cargando texto="Cargando el proyecto…" />;
  if (error) {
    const titulo = estadoHttp === 404 ? 'Proyecto no encontrado' : estadoHttp === 403 ? 'No tienes acceso a este proyecto' : 'No se pudo cargar el proyecto';
    return (
      <>
        <h1>{titulo}</h1>
        <Aviso tipo="error">{error}</Aviso>
        <p><Link className="btn" to="/proyectos">Volver a proyectos</Link></p>
      </>
    );
  }

  return (
    <>
      <nav aria-label="Ruta de navegación" className="migas"><Link to="/proyectos">Proyectos</Link> / <span>{proyecto.nombre}</span></nav>
      <h1>{proyecto.nombre}</h1>
      <Aviso tipo="error">{errorEliminar}</Aviso>
      <div className="detalle-rejilla">
        <section className="tarjeta" aria-labelledby="titulo-datos">
          <h2 id="titulo-datos">Datos del proyecto</h2>
          <dl className="datos">
            <dt>Cliente</dt><dd>{proyecto.cliente}</dd>
            <dt>Servicio</dt><dd>{proyecto.servicio}</dd>
            <dt>Estado</dt><dd><span className={`insignia insignia-${{ Pendiente: 'pendiente', 'En curso': 'en-curso', Completado: 'completado' }[proyecto.estado]}`}>{proyecto.estado}</span></dd>
            <dt>Presupuesto</dt><dd className="dinero">{formatoMXN(proyecto.presupuesto)}</dd>
            <dt>Fecha de entrega</dt><dd>{formatoFecha(proyecto.fechaEntrega)}</dd>
            <dt>Responsable</dt><dd>{proyecto.propietario?.nombre || 'Sin responsable'}</dd>
            <dt>Descripción</dt><dd>{proyecto.descripcion || 'Sin descripción.'}</dd>
          </dl>
          <div className="acciones">
            <Link className="btn" to={`/proyectos/${proyecto._id}/editar`}>Editar</Link>
            <button type="button" className="btn-accion peligro" onClick={() => setConfirmar(true)}>Eliminar</button>
          </div>
        </section>
        <ConversorPresupuesto presupuesto={proyecto.presupuesto} />
      </div>
      <ConfirmarDialogo
        abierto={confirmar}
        titulo="¿Eliminar este proyecto?"
        mensaje={`Se eliminará «${proyecto.nombre}». Esta acción no se puede deshacer.`}
        ocupado={eliminando}
        onConfirmar={eliminar}
        onCancelar={() => !eliminando && setConfirmar(false)}
      />
    </>
  );
}

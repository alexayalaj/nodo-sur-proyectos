import { Link } from 'react-router-dom';
import { formatoFecha, formatoMXN } from '../util/formato.js';

const CLASE_ESTADO = { Pendiente: 'pendiente', 'En curso': 'en-curso', Completado: 'completado' };

export default function TarjetaProyecto({ proyecto, mostrarPropietario }) {
  return (
    <li className={`tarjeta-proyecto ${CLASE_ESTADO[proyecto.estado] || ''}`}>
      <span className={`insignia insignia-${CLASE_ESTADO[proyecto.estado] || 'pendiente'}`}>{proyecto.estado}</span>
      <h3>
        <Link to={`/proyectos/${proyecto._id}`}>{proyecto.nombre}</Link>
      </h3>
      <p className="meta">{proyecto.cliente} · {proyecto.servicio}</p>
      <p className="dinero">{formatoMXN(proyecto.presupuesto)}</p>
      <p className="meta">Entrega: {formatoFecha(proyecto.fechaEntrega)}</p>
      {mostrarPropietario && proyecto.propietario?.nombre && <p className="meta">Responsable: {proyecto.propietario.nombre}</p>}
      <div className="acciones">
        <Link className="btn-accion" to={`/proyectos/${proyecto._id}`}>Ver detalle</Link>
        <Link className="btn-accion" to={`/proyectos/${proyecto._id}/editar`}>Editar</Link>
      </div>
    </li>
  );
}

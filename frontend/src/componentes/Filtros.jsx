import { useEffect, useState } from 'react';
import { ESTADOS, ORDENES, SERVICIOS } from '../util/formato.js';

// Los filtros viven en la URL (useSearchParams): se pueden compartir y sobreviven a una recarga.
export default function Filtros({ parametros, onCambiar, propietarios }) {
  const [texto, setTexto] = useState(parametros.get('q') || '');

  // La búsqueda espera 350 ms después de la última tecla para no consultar en cada letra
  useEffect(() => {
    if (texto === (parametros.get('q') || '')) return undefined;
    const t = setTimeout(() => onCambiar({ q: texto }), 350);
    return () => clearTimeout(t);
  }, [texto]); // eslint-disable-line react-hooks/exhaustive-deps

  // Si la URL cambia desde fuera (por ejemplo "Limpiar filtros"), el campo se sincroniza
  useEffect(() => setTexto(parametros.get('q') || ''), [parametros]);

  const hayFiltros = ['q', 'estado', 'servicio', 'propietario'].some((c) => parametros.get(c));

  return (
    <form className="filtros" role="search" aria-label="Filtros de proyectos" onSubmit={(e) => e.preventDefault()}>
      <div className="campo">
        <label htmlFor="f-q">Buscar</label>
        <input id="f-q" type="search" value={texto} placeholder="Nombre o cliente" maxLength={80} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <div className="campo">
        <label htmlFor="f-estado">Estado</label>
        <select id="f-estado" value={parametros.get('estado') || ''} onChange={(e) => onCambiar({ estado: e.target.value })}>
          <option value="">Todos</option>
          {ESTADOS.map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="f-servicio">Servicio</label>
        <select id="f-servicio" value={parametros.get('servicio') || ''} onChange={(e) => onCambiar({ servicio: e.target.value })}>
          <option value="">Todos</option>
          {SERVICIOS.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {propietarios && (
        <div className="campo">
          <label htmlFor="f-propietario">Propietario</label>
          <select id="f-propietario" value={parametros.get('propietario') || ''} onChange={(e) => onCambiar({ propietario: e.target.value })}>
            <option value="">Todos</option>
            {propietarios.map((u) => <option key={u._id} value={u._id}>{u.nombre}</option>)}
          </select>
        </div>
      )}
      <div className="campo">
        <label htmlFor="f-orden">Ordenar por</label>
        <select id="f-orden" value={parametros.get('orden') || '-createdAt'} onChange={(e) => onCambiar({ orden: e.target.value })}>
          {ORDENES.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
        </select>
      </div>
      {hayFiltros && (
        <button type="button" className="btn-accion limpiar" onClick={() => onCambiar({ q: '', estado: '', servicio: '', propietario: '' })}>
          Limpiar filtros
        </button>
      )}
    </form>
  );
}

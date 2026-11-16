import { useEffect, useState } from 'react';
import { api } from '../api/cliente.js';
import { formatoMXN, formatoOtraMoneda, MONEDAS } from '../util/formato.js';
import Aviso from './Aviso.jsx';
import Cargando from './Cargando.jsx';

// Convierte el presupuesto (MXN) con el tipo de cambio que entrega la API externa a través del servidor.
export default function ConversorPresupuesto({ presupuesto }) {
  const [moneda, setMoneda] = useState('USD');
  const [estado, setEstado] = useState({ cargando: true, error: '', datos: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ cargando: true, error: '', datos: null });
    api
      .get(`/api/tipo-cambio?monedas=${moneda}`)
      .then((r) => vigente && setEstado({ cargando: false, error: '', datos: r.data }))
      .catch((e) => vigente && setEstado({ cargando: false, error: e.message, datos: null }));
    return () => { vigente = false; };
  }, [moneda, intento]);

  const { cargando, error, datos } = estado;
  return (
    <section className="tarjeta conversor" aria-labelledby="titulo-conversor">
      <h2 id="titulo-conversor">Presupuesto en otra moneda</h2>
      <div className="campo">
        <label htmlFor="moneda">Moneda de destino</label>
        <select id="moneda" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
          {MONEDAS.map((m) => <option key={m}>{m}</option>)}
        </select>
      </div>
      {cargando && <Cargando texto="Consultando el tipo de cambio…" />}
      {error && (
        <>
          <Aviso tipo="error">{error}</Aviso>
          <button type="button" className="btn-accion" onClick={() => setIntento(intento + 1)}>Reintentar</button>
        </>
      )}
      {datos && (
        <div aria-live="polite">
          <p className="conversion">{formatoMXN(presupuesto)} <span aria-hidden="true">≈</span><span className="solo-lectores"> equivalen a </span> <strong>{formatoOtraMoneda(presupuesto * datos.tasas[moneda], moneda)}</strong></p>
          <p className="meta">1 MXN = {datos.tasas[moneda]} {moneda} · Tasa del {datos.fecha} · Fuente: {datos.fuente}</p>
        </div>
      )}
    </section>
  );
}

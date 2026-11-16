import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useSesion } from '../context/SesionContext.jsx';
import Aviso from '../componentes/Aviso.jsx';
import Cargando from '../componentes/Cargando.jsx';
import EstadoVacio from '../componentes/EstadoVacio.jsx';
import TarjetaProyecto from '../componentes/TarjetaProyecto.jsx';
import { formatoMXN, formatoOtraMoneda } from '../util/formato.js';

function Indicador({ titulo, valor, clase = '', detalle }) {
  return (
    <div className={`indicador ${clase}`}>
      <p className="indicador-titulo">{titulo}</p>
      <p className="indicador-valor">{valor}</p>
      {detalle && <p className="meta">{detalle}</p>}
    </div>
  );
}

export default function Tablero() {
  const { usuario, esAdmin } = useSesion();
  const [estado, setEstado] = useState({ cargando: true, error: '', resumen: null, recientes: [] });
  const [dolares, setDolares] = useState(null);

  useEffect(() => {
    document.title = 'Tablero · Proyectos Nodo Sur';
    let vigente = true;
    Promise.all([api.get('/api/proyectos/resumen'), api.get('/api/proyectos?limite=4&orden=-createdAt')])
      .then(([r, p]) => {
        if (!vigente) return;
        setEstado({ cargando: false, error: '', resumen: r.data, recientes: p.data });
        // El equivalente en dólares es un extra: si la API externa falla, el tablero sigue funcionando
        api.get('/api/tipo-cambio?monedas=USD').then((t) => vigente && setDolares(t.data)).catch(() => {});
      })
      .catch((e) => vigente && setEstado({ cargando: false, error: e.message, resumen: null, recientes: [] }));
    return () => { vigente = false; };
  }, []);

  const { cargando, error, resumen, recientes } = estado;
  return (
    <>
      <h1>Hola, {usuario.nombre.split(' ')[0]}</h1>
      <p className="intro">{esAdmin ? 'Resumen de todos los proyectos de Nodo Sur.' : 'Resumen de tus proyectos.'}</p>
      {cargando && <Cargando texto="Cargando el tablero…" />}
      <Aviso tipo="error">{error}</Aviso>
      {resumen && (
        <>
          <section className="indicadores" aria-label="Indicadores">
            <Indicador titulo="Proyectos" valor={resumen.total} />
            <Indicador titulo="Pendientes" valor={resumen.porEstado.Pendiente} clase="pendiente" />
            <Indicador titulo="En curso" valor={resumen.porEstado['En curso']} clase="en-curso" />
            <Indicador titulo="Completados" valor={resumen.porEstado.Completado} clase="completado" />
            <Indicador
              titulo="Presupuesto total"
              clase="monto"
              valor={formatoMXN(resumen.presupuestoTotal)}
              detalle={dolares ? `≈ ${formatoOtraMoneda(resumen.presupuestoTotal * dolares.tasas.USD, 'USD')}` : undefined}
            />
          </section>
          <section aria-labelledby="titulo-recientes">
            <div className="barra-herramientas">
              <h2 id="titulo-recientes">Proyectos recientes</h2>
              <Link className="btn" to="/proyectos/nuevo">+ Nuevo proyecto</Link>
            </div>
            {recientes.length === 0 ? (
              <EstadoVacio titulo="Aún no hay proyectos">
                <p>Crea el primero para verlo aquí.</p>
                <Link className="btn" to="/proyectos/nuevo">Crear proyecto</Link>
              </EstadoVacio>
            ) : (
              <>
                <ul className="lista">
                  {recientes.map((p) => <TarjetaProyecto key={p._id} proyecto={p} mostrarPropietario={esAdmin} />)}
                </ul>
                <p className="ver-todos"><Link to="/proyectos">Ver todos los proyectos →</Link></p>
              </>
            )}
          </section>
        </>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/cliente.js';
import Aviso from '../componentes/Aviso.jsx';
import Campo from '../componentes/Campo.jsx';
import Cargando from '../componentes/Cargando.jsx';
import { ESTADOS, SERVICIOS, valorFecha } from '../util/formato.js';

const VACIO = { nombre: '', cliente: '', servicio: SERVICIOS[0], presupuesto: '', estado: 'Pendiente', fechaEntrega: '', descripcion: '' };

export default function ProyectoForm() {
  const { id } = useParams(); // con :id es edición; sin :id es alta
  const editando = Boolean(id);
  const navegar = useNavigate();
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(editando);
  const [errorCarga, setErrorCarga] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    document.title = `${editando ? 'Editar' : 'Nuevo'} proyecto · Proyectos Nodo Sur`;
    if (!editando) { setDatos(VACIO); return undefined; }
    let vigente = true;
    setCargando(true);
    api
      .get(`/api/proyectos/${id}`)
      .then((r) => {
        if (!vigente) return;
        const p = r.data;
        setDatos({ nombre: p.nombre, cliente: p.cliente, servicio: p.servicio, presupuesto: String(p.presupuesto), estado: p.estado, fechaEntrega: valorFecha(p.fechaEntrega), descripcion: p.descripcion || '' });
        setCargando(false);
      })
      .catch((e) => vigente && (setErrorCarga(e.message), setCargando(false)));
    return () => { vigente = false; };
  }, [id, editando]);

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (datos.nombre.trim().length < 3 || datos.nombre.trim().length > 80) nuevos.nombre = 'El nombre debe tener entre 3 y 80 caracteres.';
    if (datos.cliente.trim().length < 2 || datos.cliente.trim().length > 80) nuevos.cliente = 'El cliente debe tener entre 2 y 80 caracteres.';
    const presupuesto = Number(datos.presupuesto);
    if (datos.presupuesto === '' || !Number.isFinite(presupuesto) || presupuesto < 0) nuevos.presupuesto = 'El presupuesto debe ser un número mayor o igual a 0.';
    if (datos.descripcion.length > 300) nuevos.descripcion = 'La descripción admite máximo 300 caracteres.';
    setErrores(nuevos);
    setMensaje('');
    if (Object.keys(nuevos).length) return;

    const cuerpo = {
      nombre: datos.nombre.trim(),
      cliente: datos.cliente.trim(),
      servicio: datos.servicio,
      presupuesto,
      estado: datos.estado,
      fechaEntrega: datos.fechaEntrega || null,
      descripcion: datos.descripcion.trim(),
    };
    setEnviando(true);
    try {
      const r = editando ? await api.put(`/api/proyectos/${id}`, cuerpo) : await api.post('/api/proyectos', cuerpo);
      navegar(`/proyectos/${r.data._id}`, { replace: true });
    } catch (err) {
      // Los errores por campo del servidor (400) se muestran junto a cada control
      setErrores(err.porCampo ? err.porCampo() : {});
      setMensaje(err.message);
      setEnviando(false);
    }
  }

  if (cargando) return <Cargando texto="Cargando el proyecto…" />;
  if (errorCarga) {
    return (
      <>
        <h1>No se pudo cargar el proyecto</h1>
        <Aviso tipo="error">{errorCarga}</Aviso>
        <p><Link className="btn" to="/proyectos">Volver a proyectos</Link></p>
      </>
    );
  }

  return (
    <>
      <h1>{editando ? 'Editar proyecto' : 'Nuevo proyecto'}</h1>
      <form className="tarjeta formulario" onSubmit={enviar} noValidate>
        <Campo id="nombre" etiqueta="Nombre del proyecto" error={errores.nombre}>
          {(p) => <input {...p} name="nombre" type="text" maxLength={80} value={datos.nombre} onChange={cambiar} />}
        </Campo>
        <Campo id="cliente" etiqueta="Cliente" error={errores.cliente}>
          {(p) => <input {...p} name="cliente" type="text" maxLength={80} value={datos.cliente} onChange={cambiar} />}
        </Campo>
        <div className="fila">
          <Campo id="servicio" etiqueta="Servicio" error={errores.servicio}>
            {(p) => <select {...p} name="servicio" value={datos.servicio} onChange={cambiar}>{SERVICIOS.map((s) => <option key={s}>{s}</option>)}</select>}
          </Campo>
          <Campo id="estado" etiqueta="Estado" error={errores.estado}>
            {(p) => <select {...p} name="estado" value={datos.estado} onChange={cambiar}>{ESTADOS.map((s) => <option key={s}>{s}</option>)}</select>}
          </Campo>
        </div>
        <div className="fila">
          <Campo id="presupuesto" etiqueta="Presupuesto (MXN)" error={errores.presupuesto}>
            {(p) => <input {...p} name="presupuesto" type="number" min="0" step="any" inputMode="decimal" value={datos.presupuesto} onChange={cambiar} />}
          </Campo>
          <Campo id="fechaEntrega" etiqueta="Fecha de entrega" error={errores.fechaEntrega}>
            {(p) => <input {...p} name="fechaEntrega" type="date" value={datos.fechaEntrega} onChange={cambiar} />}
          </Campo>
        </div>
        <Campo id="descripcion" etiqueta="Descripción (opcional)" error={errores.descripcion} ayuda={`${datos.descripcion.length} de 300 caracteres`}>
          {(p) => <textarea {...p} name="descripcion" rows={4} maxLength={300} value={datos.descripcion} onChange={cambiar} />}
        </Campo>
        <Aviso tipo="error">{mensaje}</Aviso>
        <div className="acciones-form">
          <Link className="btn-accion" to={editando ? `/proyectos/${id}` : '/proyectos'}>Cancelar</Link>
          <button type="submit" className="btn" disabled={enviando}>{enviando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Crear proyecto'}</button>
        </div>
      </form>
    </>
  );
}

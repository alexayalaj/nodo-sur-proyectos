import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useSesion } from '../context/SesionContext.jsx';
import Aviso from '../componentes/Aviso.jsx';
import Campo from '../componentes/Campo.jsx';

export default function Registro() {
  const { token, iniciarSesion } = useSesion();
  const navegar = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', correo: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { document.title = 'Registro · Proyectos Nodo Sur'; }, []);
  if (token) return <Navigate to="/" replace />;

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    const nuevos = {};
    if (datos.nombre.trim().length < 2 || datos.nombre.trim().length > 60) nuevos.nombre = 'El nombre debe tener entre 2 y 60 caracteres.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) nuevos.correo = 'Escribe un correo con formato válido.';
    if (datos.password.length < 8 || datos.password.length > 72) nuevos.password = 'La contraseña debe tener entre 8 y 72 caracteres.';
    if (datos.confirmar !== datos.password) nuevos.confirmar = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    setMensaje('');
    if (Object.keys(nuevos).length) return;
    setEnviando(true);
    try {
      const r = await api.post('/api/auth/registro', { nombre: datos.nombre.trim(), correo: datos.correo.trim(), password: datos.password });
      iniciarSesion(r.data.token, r.data.usuario);
      navegar('/', { replace: true });
    } catch (err) {
      setErrores(err.porCampo ? err.porCampo() : {});
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta formulario-acceso" aria-labelledby="titulo">
      <h1 id="titulo">Crear cuenta</h1>
      <form onSubmit={enviar} noValidate>
        <Campo id="nombre" etiqueta="Nombre" error={errores.nombre}>
          {(p) => <input {...p} name="nombre" type="text" autoComplete="name" value={datos.nombre} onChange={cambiar} />}
        </Campo>
        <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
          {(p) => <input {...p} name="correo" type="email" autoComplete="email" value={datos.correo} onChange={cambiar} />}
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password} ayuda="Mínimo 8 caracteres.">
          {(p) => <input {...p} name="password" type="password" autoComplete="new-password" value={datos.password} onChange={cambiar} />}
        </Campo>
        <Campo id="confirmar" etiqueta="Confirmar contraseña" error={errores.confirmar}>
          {(p) => <input {...p} name="confirmar" type="password" autoComplete="new-password" value={datos.confirmar} onChange={cambiar} />}
        </Campo>
        <Aviso tipo="error">{mensaje}</Aviso>
        <button type="submit" className="btn btn-ancho" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Registrarme'}</button>
      </form>
      <p className="alterna">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </section>
  );
}

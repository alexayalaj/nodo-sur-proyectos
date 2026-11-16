import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/cliente.js';
import { useSesion } from '../context/SesionContext.jsx';
import Aviso from '../componentes/Aviso.jsx';
import Campo from '../componentes/Campo.jsx';

export default function Login() {
  const { token, iniciarSesion, aviso, limpiarAviso } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [datos, setDatos] = useState({ correo: '', password: '' });
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => { document.title = 'Iniciar sesión · Proyectos Nodo Sur'; }, []);
  if (token) return <Navigate to="/" replace />;

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    limpiarAviso();
    const nuevos = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) nuevos.correo = 'Escribe un correo con formato válido.';
    if (!datos.password) nuevos.password = 'La contraseña es obligatoria.';
    setErrores(nuevos);
    setMensaje('');
    if (Object.keys(nuevos).length) return;
    setEnviando(true);
    try {
      const r = await api.post('/api/auth/login', { correo: datos.correo.trim(), password: datos.password });
      iniciarSesion(r.data.token, r.data.usuario);
      navegar(ubicacion.state?.desde || '/', { replace: true });
    } catch (err) {
      setErrores(err.porCampo ? err.porCampo() : {});
      setMensaje(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="tarjeta formulario-acceso" aria-labelledby="titulo">
      <h1 id="titulo">Iniciar sesión</h1>
      <p className="intro">Accede para consultar y administrar los proyectos de Nodo Sur.</p>
      <Aviso tipo="info">{aviso}</Aviso>
      <form onSubmit={enviar} noValidate>
        <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
          {(p) => <input {...p} name="correo" type="email" autoComplete="email" value={datos.correo} onChange={cambiar} />}
        </Campo>
        <Campo id="password" etiqueta="Contraseña" error={errores.password}>
          {(p) => <input {...p} name="password" type="password" autoComplete="current-password" value={datos.password} onChange={cambiar} />}
        </Campo>
        <Aviso tipo="error">{mensaje}</Aviso>
        <button type="submit" className="btn btn-ancho" disabled={enviando}>{enviando ? 'Ingresando…' : 'Iniciar sesión'}</button>
      </form>
      <p className="alterna">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
    </section>
  );
}

// Capa de acceso a la API: rutas relativas, token en localStorage y manejo de sesión expirada.
const Api = (() => {
  const CLAVE_TOKEN = 'nodosur_token';
  const CLAVE_USUARIO = 'nodosur_usuario';

  const obtenerToken = () => localStorage.getItem(CLAVE_TOKEN);
  const obtenerUsuario = () => {
    try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO)); } catch (e) { return null; }
  };
  function guardarSesion(token, usuario) {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }
  function cerrarSesion() {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }

  // Devuelve { estado, cuerpo }. Si el token expiró (TOKEN_INVALIDO) limpia la sesión.
  async function pedir(metodo, ruta, datos) {
    const headers = {};
    if (datos !== undefined) headers['Content-Type'] = 'application/json';
    const token = obtenerToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    let respuesta;
    try {
      respuesta = await fetch(ruta, { method: metodo, headers, body: datos !== undefined ? JSON.stringify(datos) : undefined });
    } catch (e) {
      return { estado: 0, cuerpo: { ok: false, message: 'No se pudo conectar con el servidor.' } };
    }
    let cuerpo;
    try { cuerpo = await respuesta.json(); } catch (e) { cuerpo = { ok: false, message: 'Respuesta no válida del servidor.' }; }
    if (cuerpo.codigo === 'TOKEN_INVALIDO') cerrarSesion();
    return { estado: respuesta.status, cuerpo };
  }

  return { obtenerToken, obtenerUsuario, guardarSesion, cerrarSesion, pedir };
})();

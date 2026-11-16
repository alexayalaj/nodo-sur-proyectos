// Capa de acceso a la API: rutas relativas, token Bearer y cierre de sesión cuando el servidor
// avisa que el token expiró, es inválido o la cuenta fue desactivada.
const CLAVE = 'nodosur_sesion';
const CODIGOS_DE_CIERRE = ['TOKEN_INVALIDO', 'CUENTA_DESACTIVADA'];

export const leerSesion = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE));
  } catch (e) {
    return null;
  }
};
export const guardarSesion = (sesion) => localStorage.setItem(CLAVE, JSON.stringify(sesion));
export const borrarSesion = () => localStorage.removeItem(CLAVE);

let alCerrarSesion = () => {};
export const registrarCierreDeSesion = (fn) => {
  alCerrarSesion = fn;
};

export class ErrorApi extends Error {
  constructor(mensaje, estado, errores = [], codigo = null) {
    super(mensaje);
    this.estado = estado;
    this.errores = errores; // [{ campo, mensaje }]
    this.codigo = codigo;
  }
  // Mensajes de validación indexados por campo, para mostrarlos junto a cada control
  porCampo() {
    return Object.fromEntries(this.errores.map((e) => [e.campo, e.mensaje]));
  }
}

async function pedir(metodo, ruta, datos) {
  const headers = { Accept: 'application/json' };
  if (datos !== undefined) headers['Content-Type'] = 'application/json';
  const sesion = leerSesion();
  if (sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, { method: metodo, headers, body: datos !== undefined ? JSON.stringify(datos) : undefined });
  } catch (e) {
    throw new ErrorApi('No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.', 0);
  }
  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch (e) {
    throw new ErrorApi('El servidor devolvió una respuesta no válida.', respuesta.status);
  }
  if (cuerpo.codigo && CODIGOS_DE_CIERRE.includes(cuerpo.codigo)) alCerrarSesion(cuerpo.codigo);
  if (!respuesta.ok || !cuerpo.ok) {
    throw new ErrorApi(cuerpo.message || 'Ocurrió un error inesperado.', respuesta.status, cuerpo.errores, cuerpo.codigo);
  }
  return cuerpo; // { ok, data, meta?, message }
}

export const api = {
  get: (ruta) => pedir('GET', ruta),
  post: (ruta, datos) => pedir('POST', ruta, datos),
  put: (ruta, datos) => pedir('PUT', ruta, datos),
  patch: (ruta, datos) => pedir('PATCH', ruta, datos),
  eliminar: (ruta) => pedir('DELETE', ruta),
};

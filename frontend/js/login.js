const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');
const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const aviso = document.getElementById('aviso');
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = `mensaje ${tipo || ''}`;
}

function marcarError(idCampo, idError, texto) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById(idError);
  campo.classList.toggle('invalido', Boolean(texto));
  campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  if (texto) { campo.setAttribute('aria-describedby', idError); error.textContent = texto; error.hidden = false; }
  else { campo.removeAttribute('aria-describedby'); error.hidden = true; }
  return !texto;
}

function elegirPestana(registro) {
  formLogin.hidden = registro;
  formRegistro.hidden = !registro;
  tabLogin.classList.toggle('activo', !registro);
  tabRegistro.classList.toggle('activo', registro);
  tabLogin.setAttribute('aria-pressed', String(!registro));
  tabRegistro.setAttribute('aria-pressed', String(registro));
  mostrarAviso('');
}
tabLogin.addEventListener('click', () => elegirPestana(false));
tabRegistro.addEventListener('click', () => elegirPestana(true));

async function enviar(ruta, datos) {
  mostrarAviso('Procesando...');
  const { estado, cuerpo } = await Api.pedir('POST', ruta, datos);
  if (cuerpo.ok) {
    Api.guardarSesion(cuerpo.data.token, cuerpo.data.usuario);
    window.location.href = 'proyectos.html';
    return;
  }
  mostrarAviso(cuerpo.message || `Error ${estado}`, 'error');
}

formLogin.addEventListener('submit', (e) => {
  e.preventDefault();
  const correo = document.getElementById('login-correo').value.trim();
  const password = document.getElementById('login-password').value;
  const v1 = marcarError('login-correo', 'err-login-correo', REGEX_CORREO.test(correo) ? '' : 'Escribe un correo válido.');
  const v2 = marcarError('login-password', 'err-login-password', password ? '' : 'La contraseña es obligatoria.');
  if (v1 && v2) enviar('/api/auth/login', { correo, password });
});

formRegistro.addEventListener('submit', (e) => {
  e.preventDefault();
  const nombre = document.getElementById('reg-nombre').value.trim();
  const correo = document.getElementById('reg-correo').value.trim();
  const password = document.getElementById('reg-password').value;
  const v1 = marcarError('reg-nombre', 'err-reg-nombre', nombre.length >= 2 ? '' : 'El nombre debe tener al menos 2 caracteres.');
  const v2 = marcarError('reg-correo', 'err-reg-correo', REGEX_CORREO.test(correo) ? '' : 'Escribe un correo válido.');
  const v3 = marcarError('reg-password', 'err-reg-password', password.length >= 8 ? '' : 'La contraseña debe tener al menos 8 caracteres.');
  if (v1 && v2 && v3) enviar('/api/auth/registro', { nombre, correo, password });
});

if (Api.obtenerToken()) window.location.href = 'proyectos.html';

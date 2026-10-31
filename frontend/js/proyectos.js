const lista = document.getElementById('lista-proyectos');
const vacio = document.getElementById('vacio');
const cargando = document.getElementById('cargando');
const contador = document.getElementById('contador');
const aviso = document.getElementById('aviso');
const dialogo = document.getElementById('dialogo');
const form = document.getElementById('form-proyecto');
const btnNuevo = document.getElementById('btn-nuevo');
const btnSalir = document.getElementById('btn-salir');
const btnIrLogin = document.getElementById('btn-ir-login');
const usuarioActivo = document.getElementById('usuario-activo');
const avisoForm = document.getElementById('aviso-form');

let proyectos = [];
let filtro = '';
const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

function mostrarAviso(texto, tipo) {
  aviso.textContent = texto;
  aviso.className = `mensaje ${tipo || ''}`;
}

function usuarioId() {
  const u = Api.obtenerUsuario();
  return Api.obtenerToken() && u ? u.id : null;
}

function actualizarSesion() {
  const u = Api.obtenerUsuario();
  const activa = Boolean(Api.obtenerToken() && u);
  usuarioActivo.textContent = activa ? `Sesión: ${u.nombre}` : 'Modo lectura';
  btnNuevo.hidden = !activa;
  btnSalir.hidden = !activa;
  btnIrLogin.hidden = activa;
}

// Si la API indica sesión vencida, se limpia y se pide iniciar sesión de nuevo
function manejarSesionVencida(cuerpo) {
  if (cuerpo.codigo === 'TOKEN_INVALIDO') {
    actualizarSesion();
    mostrarAviso('Tu sesión expiró. Inicia sesión de nuevo para continuar.', 'error');
    render();
    return true;
  }
  return false;
}

function crearElemento(etiqueta, texto, clase) {
  const el = document.createElement(etiqueta);
  if (texto !== undefined) el.textContent = texto; // textContent evita inyectar HTML
  if (clase) el.className = clase;
  return el;
}

function tarjeta(p) {
  const li = crearElemento('li', undefined, `proyecto ${p.estado === 'Completado' ? 'completado' : p.estado === 'Pendiente' ? 'pendiente' : ''}`);
  li.dataset.id = p._id;
  li.appendChild(crearElemento('h3', p.nombre));
  li.appendChild(crearElemento('span', p.estado, 'etiqueta'));
  li.appendChild(crearElemento('p', `Cliente: ${p.cliente}`));
  li.appendChild(crearElemento('p', `Servicio: ${p.servicio}`));
  li.appendChild(crearElemento('p', moneda.format(p.presupuesto), 'dinero'));
  if (p.fechaEntrega) li.appendChild(crearElemento('p', `Entrega: ${new Date(p.fechaEntrega).toLocaleDateString('es-MX', { timeZone: 'UTC' })}`, 'meta'));
  if (p.descripcion) li.appendChild(crearElemento('p', p.descripcion, 'meta'));
  li.appendChild(crearElemento('p', `Responsable: ${p.propietario && p.propietario.nombre ? p.propietario.nombre : 'N/D'}`, 'meta'));

  const propio = usuarioId() && p.propietario && p.propietario._id === usuarioId();
  if (propio) {
    const acciones = crearElemento('div', undefined, 'acciones');
    const editar = crearElemento('button', 'Editar', 'btn-accion');
    editar.type = 'button';
    editar.setAttribute('aria-label', `Editar ${p.nombre}`);
    editar.addEventListener('click', () => abrirFormulario(p));
    const borrar = crearElemento('button', 'Eliminar', 'btn-accion peligro');
    borrar.type = 'button';
    borrar.setAttribute('aria-label', `Eliminar ${p.nombre}`);
    borrar.addEventListener('click', () => eliminar(p));
    acciones.append(editar, borrar);
    li.appendChild(acciones);
  }
  return li;
}

function render() {
  const visibles = proyectos.filter((p) => !filtro || p.estado === filtro);
  lista.replaceChildren(...visibles.map(tarjeta));
  vacio.hidden = visibles.length > 0;
  const total = visibles.reduce((suma, p) => suma + p.presupuesto, 0);
  contador.textContent = `${visibles.length} proyecto(s) | Presupuesto total: ${moneda.format(total)}`;
}

async function cargar() {
  cargando.hidden = false;
  const { cuerpo } = await Api.pedir('GET', '/api/proyectos');
  cargando.hidden = true;
  if (!cuerpo.ok) {
    mostrarAviso(cuerpo.message, 'error');
    return;
  }
  proyectos = cuerpo.data;
  render();
}

// Filtros
document.getElementById('filtros').addEventListener('click', (e) => {
  const boton = e.target.closest('.filtro');
  if (!boton) return;
  filtro = boton.dataset.estado;
  document.querySelectorAll('#filtros .filtro').forEach((b) => {
    const activo = b === boton;
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-pressed', String(activo));
  });
  render();
});

// Formulario modal
function marcarError(idCampo, texto) {
  const campo = document.getElementById(idCampo);
  const error = document.getElementById(`err-${idCampo}`);
  campo.classList.toggle('invalido', Boolean(texto));
  campo.setAttribute('aria-invalid', texto ? 'true' : 'false');
  if (texto) { campo.setAttribute('aria-describedby', error.id); error.textContent = texto; error.hidden = false; }
  else { campo.removeAttribute('aria-describedby'); error.hidden = true; }
  return !texto;
}

function abrirFormulario(p) {
  form.reset();
  ['p-nombre', 'p-cliente', 'p-servicio', 'p-presupuesto'].forEach((id) => marcarError(id, ''));
  avisoForm.textContent = '';
  document.getElementById('dialogo-titulo').textContent = p ? 'Editar proyecto' : 'Nuevo proyecto';
  document.getElementById('p-id').value = p ? p._id : '';
  if (p) {
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-cliente').value = p.cliente;
    document.getElementById('p-servicio').value = p.servicio;
    document.getElementById('p-presupuesto').value = p.presupuesto;
    document.getElementById('p-estado').value = p.estado;
    document.getElementById('p-fecha').value = p.fechaEntrega ? p.fechaEntrega.slice(0, 10) : '';
    document.getElementById('p-descripcion').value = p.descripcion || '';
  }
  dialogo.showModal();
  document.getElementById('p-nombre').focus();
}

btnNuevo.addEventListener('click', () => abrirFormulario(null));
document.getElementById('btn-cancelar').addEventListener('click', () => dialogo.close());

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('p-nombre').value.trim();
  const cliente = document.getElementById('p-cliente').value.trim();
  const servicio = document.getElementById('p-servicio').value;
  const presupuestoTxt = document.getElementById('p-presupuesto').value;
  const presupuesto = Number(presupuestoTxt);

  const v = [
    marcarError('p-nombre', nombre.length >= 3 ? '' : 'El nombre debe tener al menos 3 caracteres.'),
    marcarError('p-cliente', cliente.length >= 2 ? '' : 'El cliente debe tener al menos 2 caracteres.'),
    marcarError('p-servicio', servicio ? '' : 'Selecciona un servicio.'),
    marcarError('p-presupuesto', presupuestoTxt !== '' && presupuesto >= 0 ? '' : 'Escribe un presupuesto mayor o igual a 0.'),
  ];
  if (v.includes(false)) return;

  const datos = {
    nombre, cliente, servicio, presupuesto,
    estado: document.getElementById('p-estado').value,
    fechaEntrega: document.getElementById('p-fecha').value || null,
    descripcion: document.getElementById('p-descripcion').value.trim(),
  };
  const id = document.getElementById('p-id').value;
  const { cuerpo } = id
    ? await Api.pedir('PUT', `/api/proyectos/${id}`, datos)
    : await Api.pedir('POST', '/api/proyectos', datos);

  if (cuerpo.ok) {
    dialogo.close();
    mostrarAviso(cuerpo.message, 'ok');
    await cargar();
    return;
  }
  if (manejarSesionVencida(cuerpo)) { dialogo.close(); return; }
  avisoForm.textContent = cuerpo.message || 'No se pudo guardar el proyecto.';
});

async function eliminar(p) {
  if (!window.confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
  const { cuerpo } = await Api.pedir('DELETE', `/api/proyectos/${p._id}`);
  if (cuerpo.ok) {
    mostrarAviso(cuerpo.message, 'ok');
    await cargar();
  } else if (!manejarSesionVencida(cuerpo)) {
    mostrarAviso(cuerpo.message, 'error');
  }
}

btnSalir.addEventListener('click', () => {
  Api.cerrarSesion();
  actualizarSesion();
  mostrarAviso('Sesión cerrada.', 'ok');
  render();
});

actualizarSesion();
cargar();

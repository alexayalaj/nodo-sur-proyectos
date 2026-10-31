const mongoose = require('mongoose');
const { SERVICIOS, ESTADOS } = require('../models/Proyecto');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function responder400(res, errores) {
  return res.status(400).json({ ok: false, data: null, message: errores.join(' '), errores });
}

const esTexto = (v) => typeof v === 'string'; // bloquea objetos como {"$gt":""}

function validarRegistro(req, res, next) {
  const { nombre, correo, password } = req.body || {};
  const errores = [];
  if (!esTexto(nombre) || nombre.trim().length < 2 || nombre.trim().length > 60) errores.push('El nombre debe tener entre 2 y 60 caracteres.');
  if (!esTexto(correo) || !REGEX_CORREO.test(correo.trim())) errores.push('El correo no tiene un formato válido.');
  if (!esTexto(password) || password.length < 8 || password.length > 72) errores.push('La contraseña debe tener entre 8 y 72 caracteres.');
  if (errores.length) return responder400(res, errores);
  return next();
}

function validarLogin(req, res, next) {
  const { correo, password } = req.body || {};
  const errores = [];
  if (!esTexto(correo) || !REGEX_CORREO.test(correo.trim())) errores.push('El correo no tiene un formato válido.');
  if (!esTexto(password) || password.length === 0) errores.push('La contraseña es obligatoria.');
  if (errores.length) return responder400(res, errores);
  return next();
}

// En la creación todos los campos obligatorios deben venir; en la actualización solo se validan los que lleguen.
function validarProyecto(completo) {
  return (req, res, next) => {
    const b = req.body || {};
    const errores = [];
    const presente = (campo) => b[campo] !== undefined;

    if (completo || presente('nombre')) {
      if (!esTexto(b.nombre) || b.nombre.trim().length < 3 || b.nombre.trim().length > 80) errores.push('El nombre debe tener entre 3 y 80 caracteres.');
    }
    if (completo || presente('cliente')) {
      if (!esTexto(b.cliente) || b.cliente.trim().length < 2 || b.cliente.trim().length > 80) errores.push('El cliente debe tener entre 2 y 80 caracteres.');
    }
    if (completo || presente('servicio')) {
      if (!esTexto(b.servicio) || !SERVICIOS.includes(b.servicio)) errores.push(`El servicio debe ser uno de: ${SERVICIOS.join(', ')}.`);
    }
    if (completo || presente('presupuesto')) {
      if (typeof b.presupuesto !== 'number' || !Number.isFinite(b.presupuesto) || b.presupuesto < 0) errores.push('El presupuesto debe ser un número mayor o igual a 0.');
    }
    if (presente('estado') && (!esTexto(b.estado) || !ESTADOS.includes(b.estado))) errores.push(`El estado debe ser uno de: ${ESTADOS.join(', ')}.`);
    if (presente('fechaEntrega') && b.fechaEntrega !== null && b.fechaEntrega !== '' && (!esTexto(b.fechaEntrega) || Number.isNaN(Date.parse(b.fechaEntrega)))) errores.push('La fecha de entrega no es válida.');
    if (presente('descripcion') && (!esTexto(b.descripcion) || b.descripcion.length > 300)) errores.push('La descripción debe ser texto de máximo 300 caracteres.');

    if (!completo && Object.keys(b).length === 0) errores.push('No se envió ningún campo para actualizar.');
    if (errores.length) return responder400(res, errores);
    return next();
  };
}

function validarId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || String(req.params.id).length !== 24) {
    return responder400(res, ['El identificador del proyecto no es válido.']);
  }
  return next();
}

module.exports = { validarRegistro, validarLogin, validarProyecto, validarId };

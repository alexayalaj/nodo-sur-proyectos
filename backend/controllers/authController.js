const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// El rol viaja en el payload para que el frontend lo use al mostrar opciones;
// el servidor siempre revalida el rol contra la base de datos en autenticar.
function firmarToken(usuario) {
  return jwt.sign({ id: usuario._id, correo: usuario.correo, rol: usuario.rol }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
  });
}

function datosPublicos(usuario) {
  return { id: usuario._id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol };
}

async function registro(req, res, next) {
  try {
    // Solo se leen estos tres campos: un "rol" enviado por el cliente se ignora
    const { nombre, correo, password } = req.body;
    const existente = await Usuario.findOne({ correo: correo.trim().toLowerCase() });
    if (existente) {
      return res.status(409).json({ ok: false, data: null, message: 'Ese correo ya está registrado.' });
    }
    const hash = await bcrypt.hash(password, 10);
    const usuario = await Usuario.create({ nombre, correo, password: hash });
    return res.status(201).json({
      ok: true,
      data: { token: firmarToken(usuario), usuario: datosPublicos(usuario) },
      message: 'Usuario registrado correctamente.',
    });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { correo, password } = req.body;
    const usuario = await Usuario.findOne({ correo: correo.trim().toLowerCase() }).select('+password');
    // Mensaje genérico: no revela si el correo existe
    const credencialesInvalidas = () =>
      res.status(401).json({ ok: false, data: null, message: 'Correo o contraseña incorrectos.' });
    if (!usuario) return credencialesInvalidas();
    const coincide = await bcrypt.compare(password, usuario.password);
    if (!coincide) return credencialesInvalidas();
    if (!usuario.activo) {
      return res.status(403).json({ ok: false, data: null, codigo: 'CUENTA_DESACTIVADA', message: 'Tu cuenta está desactivada. Contacta a un administrador.' });
    }
    return res.status(200).json({
      ok: true,
      data: { token: firmarToken(usuario), usuario: datosPublicos(usuario) },
      message: 'Inicio de sesión correcto.',
    });
  } catch (err) {
    return next(err);
  }
}

async function perfil(req, res, next) {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    return res.status(200).json({ ok: true, data: datosPublicos(usuario), message: 'Perfil obtenido.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { registro, login, perfil };

const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const { SERVICIOS, ESTADOS } = require('../models/Proyecto');
const { ROLES } = require('../models/Usuario');

const ORDENES = ['createdAt', '-createdAt', 'nombre', '-nombre', 'presupuesto', '-presupuesto', 'fechaEntrega', '-fechaEntrega'];

// Exigir typeof 'string' bloquea objetos como {"$gt":""} y arreglos antes de llegar a Mongoose.
const esCadena = (v) => typeof v === 'string';
const cadena = (chain, mensaje) => chain.custom(esCadena).withMessage(mensaje).bail();

// Corta con 400 y devuelve la lista de errores por campo si alguna regla falló.
function resultado(req, res, next) {
  const errores = validationResult(req).array({ onlyFirstError: true }).map((e) => ({ campo: e.path, mensaje: e.msg }));
  if (errores.length) {
    return res.status(400).json({ ok: false, data: null, message: errores.map((e) => e.mensaje).join(' '), errores });
  }
  return next();
}

const validarRegistro = [
  cadena(body('nombre'), 'El nombre debe ser texto.').trim().isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres.'),
  cadena(body('correo'), 'El correo debe ser texto.').trim().isEmail().withMessage('El correo no tiene un formato válido.'),
  cadena(body('password'), 'La contraseña debe ser texto.').isLength({ min: 8, max: 72 }).withMessage('La contraseña debe tener entre 8 y 72 caracteres.'),
  resultado,
];

const validarLogin = [
  cadena(body('correo'), 'El correo debe ser texto.').trim().isEmail().withMessage('El correo no tiene un formato válido.'),
  cadena(body('password'), 'La contraseña debe ser texto.').notEmpty().withMessage('La contraseña es obligatoria.'),
  resultado,
];

const fechaValida = (v) => v === null || v === '' || (esCadena(v) && !Number.isNaN(Date.parse(v)));

// En la creación todos los campos obligatorios deben venir; en la edición solo se validan los que lleguen.
function validarProyecto(completo) {
  const regla = (campo) => {
    const chain = body(campo);
    return completo ? chain : chain.optional();
  };
  return [
    (req, res, next) => {
      if (!completo && (!req.body || Object.keys(req.body).length === 0)) {
        return res.status(400).json({ ok: false, data: null, message: 'No se envió ningún campo para actualizar.', errores: [{ campo: 'body', mensaje: 'No se envió ningún campo para actualizar.' }] });
      }
      return next();
    },
    cadena(regla('nombre'), 'El nombre debe ser texto.').trim().isLength({ min: 3, max: 80 }).withMessage('El nombre debe tener entre 3 y 80 caracteres.'),
    cadena(regla('cliente'), 'El cliente debe ser texto.').trim().isLength({ min: 2, max: 80 }).withMessage('El cliente debe tener entre 2 y 80 caracteres.'),
    regla('servicio').custom((v) => esCadena(v) && SERVICIOS.includes(v)).withMessage(`El servicio debe ser uno de: ${SERVICIOS.join(', ')}.`),
    regla('presupuesto').custom((v) => typeof v === 'number' && Number.isFinite(v) && v >= 0).withMessage('El presupuesto debe ser un número mayor o igual a 0.'),
    body('estado').optional().custom((v) => esCadena(v) && ESTADOS.includes(v)).withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}.`),
    body('fechaEntrega').optional().custom(fechaValida).withMessage('La fecha de entrega no es válida.'),
    body('descripcion').optional().custom((v) => esCadena(v) && v.length <= 300).withMessage('La descripción debe ser texto de máximo 300 caracteres.'),
    resultado,
  ];
}

const esObjectId = (v) => esCadena(v) && v.length === 24 && mongoose.Types.ObjectId.isValid(v);
const validarId = [param('id').custom(esObjectId).withMessage('El identificador no es válido.'), resultado];

const entero = (campo, min, max, mensaje) =>
  query(campo).optional().custom((v) => esCadena(v) && /^\d+$/.test(v) && Number(v) >= min && Number(v) <= max).withMessage(mensaje);

const validarPaginacion = [
  entero('pagina', 1, 100000, 'La página debe ser un entero mayor o igual a 1.'),
  entero('limite', 1, 50, 'El límite debe ser un entero entre 1 y 50.'),
];

const validarConsultaProyectos = [
  ...validarPaginacion,
  query('estado').optional().custom((v) => esCadena(v) && ESTADOS.includes(v)).withMessage(`El estado debe ser uno de: ${ESTADOS.join(', ')}.`),
  query('servicio').optional().custom((v) => esCadena(v) && SERVICIOS.includes(v)).withMessage(`El servicio debe ser uno de: ${SERVICIOS.join(', ')}.`),
  query('q').optional().custom((v) => esCadena(v) && v.length <= 80).withMessage('La búsqueda debe ser texto de máximo 80 caracteres.'),
  query('orden').optional().custom((v) => esCadena(v) && ORDENES.includes(v)).withMessage(`El orden debe ser uno de: ${ORDENES.join(', ')}.`),
  query('propietario').optional().custom(esObjectId).withMessage('El propietario no es válido.'),
  resultado,
];

const validarConsultaPaginada = [...validarPaginacion, resultado];

const validarRol = [
  param('id').custom(esObjectId).withMessage('El identificador no es válido.'),
  body('rol').custom((v) => esCadena(v) && ROLES.includes(v)).withMessage(`El rol debe ser uno de: ${ROLES.join(', ')}.`),
  resultado,
];

const validarEstadoUsuario = [
  param('id').custom(esObjectId).withMessage('El identificador no es válido.'),
  body('activo').custom((v) => typeof v === 'boolean').withMessage('El campo activo debe ser verdadero o falso.'),
  resultado,
];

module.exports = {
  ORDENES,
  validarRegistro,
  validarLogin,
  validarProyecto,
  validarId,
  validarConsultaProyectos,
  validarConsultaPaginada,
  validarRol,
  validarEstadoUsuario,
};

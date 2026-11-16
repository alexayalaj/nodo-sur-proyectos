const express = require('express');
const ctrl = require('../controllers/usuarioController');
const autenticar = require('../middleware/autenticar');
const { autorizar } = require('../middleware/autorizar');
const { validarConsultaPaginada, validarRol, validarEstadoUsuario } = require('../middleware/validaciones');

const router = express.Router();

// Solo administradores
router.use(autenticar, autorizar('admin'));

router.get('/', validarConsultaPaginada, ctrl.listar);
router.patch('/:id/rol', validarRol, ctrl.cambiarRol);
router.patch('/:id/estado', validarEstadoUsuario, ctrl.cambiarEstado);

module.exports = router;

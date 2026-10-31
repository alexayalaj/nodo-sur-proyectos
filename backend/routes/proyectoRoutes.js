const express = require('express');
const ctrl = require('../controllers/proyectoController');
const autenticar = require('../middleware/autenticar');
const { validarProyecto, validarId } = require('../middleware/validar');

const router = express.Router();

// Lectura pública
router.get('/', ctrl.listar);
router.get('/:id', validarId, ctrl.obtener);
// Escritura con sesión
router.post('/', autenticar, validarProyecto(true), ctrl.crear);
router.put('/:id', autenticar, validarId, validarProyecto(false), ctrl.actualizar);
router.delete('/:id', autenticar, validarId, ctrl.eliminar);

module.exports = router;

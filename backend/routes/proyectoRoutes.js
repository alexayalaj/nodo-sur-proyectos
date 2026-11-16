const express = require('express');
const ctrl = require('../controllers/proyectoController');
const autenticar = require('../middleware/autenticar');
const { esPropietarioOAdmin } = require('../middleware/autorizar');
const { validarProyecto, validarId, validarConsultaProyectos } = require('../middleware/validaciones');

const router = express.Router();

// Todas las rutas exigen sesión
router.use(autenticar);

router.get('/', validarConsultaProyectos, ctrl.listar);
router.get('/resumen', ctrl.resumen);
router.post('/', validarProyecto(true), ctrl.crear);
router.get('/:id', validarId, esPropietarioOAdmin, ctrl.obtener);
router.put('/:id', validarId, validarProyecto(false), esPropietarioOAdmin, ctrl.actualizar);
router.delete('/:id', validarId, esPropietarioOAdmin, ctrl.eliminar);

module.exports = router;

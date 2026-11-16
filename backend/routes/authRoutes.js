const express = require('express');
const { registro, login, perfil } = require('../controllers/authController');
const autenticar = require('../middleware/autenticar');
const { limiteAcceso } = require('../middleware/limites');
const { validarRegistro, validarLogin } = require('../middleware/validaciones');

const router = express.Router();

router.post('/registro', limiteAcceso, validarRegistro, registro);
router.post('/login', limiteAcceso, validarLogin, login);
router.get('/perfil', autenticar, perfil);

module.exports = router;

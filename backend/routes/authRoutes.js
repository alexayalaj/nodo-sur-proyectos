const express = require('express');
const { registro, login, perfil } = require('../controllers/authController');
const autenticar = require('../middleware/autenticar');
const { validarRegistro, validarLogin } = require('../middleware/validar');

const router = express.Router();

router.post('/registro', validarRegistro, registro);
router.post('/login', validarLogin, login);
router.get('/perfil', autenticar, perfil);

module.exports = router;

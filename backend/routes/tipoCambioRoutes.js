const express = require('express');
const { consultar, validarMonedas } = require('../controllers/tipoCambioController');
const autenticar = require('../middleware/autenticar');

const router = express.Router();

router.get('/', autenticar, validarMonedas, consultar);

module.exports = router;

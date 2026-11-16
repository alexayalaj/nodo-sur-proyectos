const { obtenerTipoCambio, MONEDAS_PERMITIDAS } = require('../services/tipoCambio');

// GET /api/tipo-cambio?monedas=USD,EUR (por defecto USD y EUR)
async function consultar(req, res, next) {
  try {
    const monedas = (req.query.monedas || 'USD,EUR').split(',').map((m) => m.trim().toUpperCase());
    const datos = await obtenerTipoCambio(monedas);
    return res.status(200).json({ ok: true, data: { ...datos, fuente: 'Frankfurter' }, message: 'Tipo de cambio obtenido.' });
  } catch (err) {
    return next(err);
  }
}

// Valida la lista de monedas contra la lista blanca antes de salir a la API externa.
function validarMonedas(req, res, next) {
  const crudo = req.query.monedas;
  if (crudo !== undefined) {
    const lista = typeof crudo === 'string' ? crudo.split(',').map((m) => m.trim().toUpperCase()) : null;
    if (!lista || lista.length === 0 || lista.length > 8 || lista.some((m) => !MONEDAS_PERMITIDAS.includes(m))) {
      const mensaje = `Las monedas deben ser una lista separada por comas con valores de: ${MONEDAS_PERMITIDAS.join(', ')}.`;
      return res.status(400).json({ ok: false, data: null, message: mensaje, errores: [{ campo: 'monedas', mensaje }] });
    }
  }
  return next();
}

module.exports = { consultar, validarMonedas };

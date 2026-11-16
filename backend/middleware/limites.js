const { rateLimit } = require('express-rate-limit');

// Limita los intentos de acceso por IP para frenar la fuerza bruta contra el login y el registro.
// LIMITE_INTENTOS permite ajustar el máximo (las pruebas lo cambian).
const limiteAcceso = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => Number(process.env.LIMITE_INTENTOS) || 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ ok: false, data: null, message: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.' });
  },
});

module.exports = { limiteAcceso };

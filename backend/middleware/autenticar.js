const jwt = require('jsonwebtoken');

// Exige el encabezado Authorization: Bearer <token>.
// Sin token: 401. Token inválido o expirado: 403 con codigo TOKEN_INVALIDO
// para que el frontend pida iniciar sesión de nuevo.
function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, data: null, message: 'Se requiere iniciar sesión.' });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, correo: payload.correo };
    return next();
  } catch (err) {
    return res.status(403).json({
      ok: false,
      data: null,
      codigo: 'TOKEN_INVALIDO',
      message: 'La sesión expiró o el token no es válido. Inicia sesión de nuevo.',
    });
  }
}

module.exports = autenticar;

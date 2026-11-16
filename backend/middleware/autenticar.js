const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// Exige el encabezado Authorization: Bearer <token>.
// Sin token: 401. Token inválido o expirado: 403 con codigo TOKEN_INVALIDO para que el
// frontend pida iniciar sesión de nuevo. Después de verificar la firma consulta al usuario:
// el rol vigente sale de la base de datos y una cuenta desactivada recibe 403.
async function autenticar(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [tipo, token] = encabezado.split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, data: null, message: 'Se requiere iniciar sesión.' });
  }
  let payload;
  try {
    // La lista de algoritmos rechaza tokens con alg "none"
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(403).json({
      ok: false,
      data: null,
      codigo: 'TOKEN_INVALIDO',
      message: 'La sesión expiró o el token no es válido. Inicia sesión de nuevo.',
    });
  }
  try {
    const usuario = await Usuario.findById(payload.id);
    if (!usuario) {
      return res.status(403).json({ ok: false, data: null, codigo: 'TOKEN_INVALIDO', message: 'El usuario de la sesión ya no existe.' });
    }
    if (!usuario.activo) {
      return res.status(403).json({ ok: false, data: null, codigo: 'CUENTA_DESACTIVADA', message: 'Tu cuenta está desactivada. Contacta a un administrador.' });
    }
    req.usuario = { id: String(usuario._id), correo: usuario.correo, nombre: usuario.nombre, rol: usuario.rol };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = autenticar;

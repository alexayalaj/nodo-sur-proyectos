const Proyecto = require('../models/Proyecto');

// autorizar('admin') deja pasar solo a los roles indicados; el resto recibe 403.
function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, data: null, message: 'No tienes permiso para realizar esta acción.' });
    }
    return next();
  };
}

// Carga el proyecto de :id y permite continuar solo al propietario o a un administrador.
// Deja el proyecto en req.proyecto para que el controlador no lo consulte otra vez.
async function esPropietarioOAdmin(req, res, next) {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) return res.status(404).json({ ok: false, data: null, message: 'Proyecto no encontrado.' });
    const esPropietario = String(proyecto.propietario) === req.usuario.id;
    if (!esPropietario && req.usuario.rol !== 'admin') {
      return res.status(403).json({ ok: false, data: null, message: 'Solo el propietario o un administrador puede realizar esta acción.' });
    }
    req.proyecto = proyecto;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { autorizar, esPropietarioOAdmin };

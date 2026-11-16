const Usuario = require('../models/Usuario');

async function listar(req, res, next) {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const limite = Number(req.query.limite) || 10;
    const [usuarios, total] = await Promise.all([
      Usuario.find().sort({ createdAt: 1 }).skip((pagina - 1) * limite).limit(limite),
      Usuario.countDocuments(),
    ]);
    return res.status(200).json({
      ok: true,
      data: usuarios,
      meta: { pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) },
      message: 'Usuarios obtenidos.',
    });
  } catch (err) {
    return next(err);
  }
}

async function cambiarRol(req, res, next) {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ ok: false, data: null, message: 'No puedes cambiar tu propio rol.' });
    }
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, data: null, message: 'Usuario no encontrado.' });
    usuario.rol = req.body.rol;
    await usuario.save();
    return res.status(200).json({ ok: true, data: usuario, message: 'Rol actualizado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    if (req.params.id === req.usuario.id) {
      return res.status(400).json({ ok: false, data: null, message: 'No puedes desactivar tu propia cuenta.' });
    }
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, data: null, message: 'Usuario no encontrado.' });
    usuario.activo = req.body.activo;
    await usuario.save();
    return res.status(200).json({
      ok: true,
      data: usuario,
      message: usuario.activo ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.',
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, cambiarRol, cambiarEstado };

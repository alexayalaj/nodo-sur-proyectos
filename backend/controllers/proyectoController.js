const Proyecto = require('../models/Proyecto');

const CAMPOS = ['nombre', 'cliente', 'servicio', 'presupuesto', 'estado', 'fechaEntrega', 'descripcion'];

// Toma del cuerpo solo los campos permitidos (el propietario nunca viene del cliente).
function tomarCampos(body) {
  const datos = {};
  for (const campo of CAMPOS) {
    if (body[campo] !== undefined) datos[campo] = body[campo] === '' ? undefined : body[campo];
  }
  return datos;
}

async function listar(req, res, next) {
  try {
    const proyectos = await Proyecto.find().populate('propietario', 'nombre').sort({ createdAt: -1 });
    return res.status(200).json({ ok: true, data: proyectos, message: 'Proyectos obtenidos.' });
  } catch (err) {
    return next(err);
  }
}

async function obtener(req, res, next) {
  try {
    const proyecto = await Proyecto.findById(req.params.id).populate('propietario', 'nombre');
    if (!proyecto) return res.status(404).json({ ok: false, data: null, message: 'Proyecto no encontrado.' });
    return res.status(200).json({ ok: true, data: proyecto, message: 'Proyecto obtenido.' });
  } catch (err) {
    return next(err);
  }
}

async function crear(req, res, next) {
  try {
    const proyecto = await Proyecto.create({ ...tomarCampos(req.body), propietario: req.usuario.id });
    return res.status(201).json({ ok: true, data: proyecto, message: 'Proyecto creado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) return res.status(404).json({ ok: false, data: null, message: 'Proyecto no encontrado.' });
    if (String(proyecto.propietario) !== req.usuario.id) {
      return res.status(403).json({ ok: false, data: null, message: 'Solo el propietario puede modificar este proyecto.' });
    }
    proyecto.set(tomarCampos(req.body));
    await proyecto.save();
    return res.status(200).json({ ok: true, data: proyecto, message: 'Proyecto actualizado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) return res.status(404).json({ ok: false, data: null, message: 'Proyecto no encontrado.' });
    if (String(proyecto.propietario) !== req.usuario.id) {
      return res.status(403).json({ ok: false, data: null, message: 'Solo el propietario puede eliminar este proyecto.' });
    }
    await proyecto.deleteOne();
    return res.status(200).json({ ok: true, data: { id: proyecto._id }, message: 'Proyecto eliminado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, eliminar };

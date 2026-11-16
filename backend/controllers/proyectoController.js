const mongoose = require('mongoose');
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

const escaparRegex = (texto) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// El usuario solo ve lo suyo; el administrador ve todo (y puede filtrar por propietario).
function filtroBase(req) {
  return req.usuario.rol === 'admin' ? {} : { propietario: req.usuario.id };
}

async function listar(req, res, next) {
  try {
    const { estado, servicio, q, orden = '-createdAt', propietario } = req.query;
    if (propietario && req.usuario.rol !== 'admin') {
      return res.status(403).json({ ok: false, data: null, message: 'Solo un administrador puede filtrar por propietario.' });
    }
    const pagina = Number(req.query.pagina) || 1;
    const limite = Number(req.query.limite) || 10;

    const filtro = filtroBase(req);
    if (propietario) filtro.propietario = propietario;
    if (estado) filtro.estado = estado;
    if (servicio) filtro.servicio = servicio;
    if (q) {
      // El texto se escapa para que se busque literalmente y no como expresión regular
      const patron = new RegExp(escaparRegex(q.trim()), 'i');
      filtro.$or = [{ nombre: patron }, { cliente: patron }];
    }
    const campo = orden.replace('-', '');
    const direccion = orden.startsWith('-') ? -1 : 1;

    const [proyectos, total] = await Promise.all([
      Proyecto.find(filtro)
        .populate('propietario', 'nombre')
        .sort({ [campo]: direccion, _id: direccion })
        .skip((pagina - 1) * limite)
        .limit(limite),
      Proyecto.countDocuments(filtro),
    ]);
    return res.status(200).json({
      ok: true,
      data: proyectos,
      meta: { pagina, limite, total, totalPaginas: Math.max(1, Math.ceil(total / limite)) },
      message: 'Proyectos obtenidos.',
    });
  } catch (err) {
    return next(err);
  }
}

// Conteo por estado y presupuesto total (MXN) para los indicadores del tablero
async function resumen(req, res, next) {
  try {
    const filas = await Proyecto.aggregate([
      { $match: req.usuario.rol === 'admin' ? {} : { propietario: new mongoose.Types.ObjectId(req.usuario.id) } },
      { $group: { _id: '$estado', cantidad: { $sum: 1 }, presupuesto: { $sum: '$presupuesto' } } },
    ]);
    const porEstado = { Pendiente: 0, 'En curso': 0, Completado: 0 };
    let total = 0;
    let presupuestoTotal = 0;
    for (const fila of filas) {
      porEstado[fila._id] = fila.cantidad;
      total += fila.cantidad;
      presupuestoTotal += fila.presupuesto;
    }
    return res.status(200).json({ ok: true, data: { total, porEstado, presupuestoTotal }, message: 'Resumen obtenido.' });
  } catch (err) {
    return next(err);
  }
}

async function obtener(req, res, next) {
  try {
    await req.proyecto.populate('propietario', 'nombre');
    return res.status(200).json({ ok: true, data: req.proyecto, message: 'Proyecto obtenido.' });
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
    req.proyecto.set(tomarCampos(req.body));
    await req.proyecto.save();
    return res.status(200).json({ ok: true, data: req.proyecto, message: 'Proyecto actualizado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

async function eliminar(req, res, next) {
  try {
    await req.proyecto.deleteOne();
    return res.status(200).json({ ok: true, data: { id: req.proyecto._id }, message: 'Proyecto eliminado correctamente.' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listar, resumen, obtener, crear, actualizar, eliminar };

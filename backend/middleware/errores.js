// Catch-all 404: va después de todas las rutas.
function noEncontrado(req, res) {
  res.status(404).json({ ok: false, data: null, message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador de errores de cuatro parámetros: debe ir al final de la pila.
// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  let estado = err.status || 500;
  let mensaje = err.message;

  if (err.type === 'entity.parse.failed') {
    estado = 400;
    mensaje = 'El cuerpo de la petición no es un JSON válido.';
  } else if (err.name === 'CastError') {
    estado = 400;
    mensaje = 'Un dato tiene un formato no válido.';
  } else if (err.name === 'ValidationError') {
    estado = 400;
    mensaje = Object.values(err.errors).map((e) => e.message).join(' ');
  } else if (err.code === 11000) {
    estado = 409;
    mensaje = 'Ya existe un registro con ese valor único.';
  }

  if (estado >= 500) {
    // Los errores de la API externa (502/504) traen un mensaje pensado para el cliente
    if (process.env.NODE_ENV !== 'test') console.error(err.expuesto ? `${estado} ${err.message}` : err.stack);
    if (process.env.NODE_ENV === 'production' && !err.expuesto) mensaje = 'Error interno del servidor.';
  }
  return res.status(estado).json({ ok: false, data: null, message: mensaje });
}

module.exports = { noEncontrado, manejadorErrores };

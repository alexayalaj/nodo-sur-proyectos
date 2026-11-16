// Registra método, ruta, código de estado y duración. No imprime cuerpos ni tokens.
function logger(req, res, next) {
  if (process.env.NODE_ENV === 'test') return next();
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    const ruta = req.originalUrl.split('?')[0];
    console.log(`${new Date().toISOString()} ${req.method} ${ruta} ${res.statusCode} ${ms.toFixed(1)}ms`);
  });
  return next();
}

module.exports = logger;

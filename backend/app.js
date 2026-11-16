const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('./config/db'); // fija sanitizeFilter antes de cualquier consulta
const logger = require('./middleware/logger');
const authRoutes = require('./routes/authRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const tipoCambioRoutes = require('./routes/tipoCambioRoutes');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

const app = express();
const enProduccion = process.env.NODE_ENV === 'production';
const dist = path.join(__dirname, '..', 'frontend', 'dist');

// En Render hay un proxy delante: sin esto el límite de intentos vería una sola IP
if (enProduccion) app.set('trust proxy', 1);
// Con el analizador extendido ?estado[$ne]=x llega como objeto y la validación lo rechaza con 400
app.set('query parser', 'extended');

// La política de contenido por defecto de helmet permite el build de Vite (scripts y estilos propios)
app.use(helmet({ contentSecurityPolicy: { directives: { 'upgrade-insecure-requests': enProduccion ? [] : null } } }));
// CORS_ORIGIN=* en local; en la nube se puede restringir a la URL pública
const origen = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: origen === '*' ? true : origen.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '100kb' }));
app.use(logger);

app.get('/api/salud', (req, res) => {
  res.status(200).json({ ok: true, data: { estado: 'activo' }, message: 'Servidor en funcionamiento.' });
});
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/tipo-cambio', tipoCambioRoutes);

// Catch-all de la API: cualquier ruta /api inexistente responde JSON 404
app.use('/api', noEncontrado);

// Frontend compilado (React) y fallback de SPA: las rutas que no son /api devuelven index.html
// para que React Router resuelva la ruta al recargar una URL profunda
app.use(express.static(dist));
app.use((req, res, next) => {
  const indice = path.join(dist, 'index.html');
  if ((req.method === 'GET' || req.method === 'HEAD') && fs.existsSync(indice)) return res.sendFile(indice);
  return next();
});

// Siempre al final: primero el 404 y después el manejador de errores
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;

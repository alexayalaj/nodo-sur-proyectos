const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const { noEncontrado, manejadorErrores } = require('./middleware/errores');

const app = express();

// CORS_ORIGIN=* en local; en la nube se puede restringir a la URL pública
const origen = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: origen === '*' ? true : origen.split(',').map((o) => o.trim()) }));
app.use(express.json());

// El mismo servidor entrega el frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/salud', (req, res) => {
  res.status(200).json({ ok: true, data: { estado: 'activo' }, message: 'Servidor en funcionamiento.' });
});
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);

// Siempre al final: primero el 404 y después el manejador de errores
app.use(noEncontrado);
app.use(manejadorErrores);

module.exports = app;

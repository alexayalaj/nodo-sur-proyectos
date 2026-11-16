// Uso: npm run promover-admin -- correo@ejemplo.com
// Convierte en administrador al usuario con ese correo en la base de MONGODB_URI (local o Atlas).
require('dotenv').config();
const mongoose = require('mongoose');
const { conectarBD } = require('../config/db');
const Usuario = require('../models/Usuario');

async function promover() {
  const correo = (process.argv[2] || '').trim().toLowerCase();
  if (!correo) throw new Error('Indica el correo: npm run promover-admin -- correo@ejemplo.com');
  await conectarBD(process.env.MONGODB_URI);
  const usuario = await Usuario.findOneAndUpdate({ correo }, { rol: 'admin', activo: true }, { returnDocument: 'after' });
  if (!usuario) throw new Error(`No existe un usuario con el correo ${correo}.`);
  console.log(`${usuario.correo} ahora es administrador.`);
}

promover()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

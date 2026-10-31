require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { conectarBD } = require('../config/db');
const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');

async function sembrar() {
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
    throw new Error('Define SEED_PASSWORD (mínimo 8 caracteres) en el archivo .env.');
  }
  await conectarBD(process.env.MONGODB_URI);
  await Proyecto.deleteMany({});
  await Usuario.deleteMany({ correo: { $in: ['ana@nodosur.example', 'luis@nodosur.example'] } });

  const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
  const ana = await Usuario.create({ nombre: 'Ana Torres', correo: 'ana@nodosur.example', password: hash });
  const luis = await Usuario.create({ nombre: 'Luis Ramírez', correo: 'luis@nodosur.example', password: hash });

  await Proyecto.insertMany([
    { nombre: 'Portal de clientes', cliente: 'Grupo Atlas', servicio: 'Desarrollo web', presupuesto: 185000, estado: 'En curso', fechaEntrega: '2026-12-15', descripcion: 'Portal web para consulta de facturas.', propietario: ana._id },
    { nombre: 'App de logística', cliente: 'Transportes del Valle', servicio: 'Aplicaciones móviles', presupuesto: 240000, estado: 'Pendiente', propietario: ana._id },
    { nombre: 'Migración a la nube', cliente: 'Clínica San José', servicio: 'Infraestructura y nube', presupuesto: 120000, estado: 'Completado', fechaEntrega: '2026-09-30', propietario: luis._id },
    { nombre: 'Auditoría de seguridad', cliente: 'Casa Fuerte', servicio: 'Consultoría TI', presupuesto: 65000, estado: 'En curso', propietario: luis._id },
  ]);
  console.log('Datos de ejemplo cargados: 2 usuarios y 4 proyectos.');
}

sembrar()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

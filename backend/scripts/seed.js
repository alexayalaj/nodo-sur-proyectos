require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { conectarBD } = require('../config/db');
const Usuario = require('../models/Usuario');
const Proyecto = require('../models/Proyecto');

const CORREOS = ['ana@nodosur.example', 'luis@nodosur.example'];
const CLIENTES = ['Grupo Atlas', 'Transportes del Valle', 'Clínica San José', 'Casa Fuerte', 'Textiles Aurora', 'Cafés del Sur', 'Logística Ceiba', 'Colegio Horizonte'];
const SERVICIOS = ['Desarrollo web', 'Aplicaciones móviles', 'Consultoría TI', 'Infraestructura y nube', 'Soporte y mantenimiento'];
const ESTADOS = ['Pendiente', 'En curso', 'Completado'];
const NOMBRES = [
  'Portal de clientes', 'App de logística', 'Migración a la nube', 'Auditoría de seguridad', 'Tienda en línea',
  'Panel de indicadores', 'App de reparto', 'Respaldo en la nube', 'Soporte mensual', 'Rediseño del sitio',
  'Integración de facturación', 'App de citas', 'Monitoreo de servidores', 'Consultoría de procesos', 'Portal de proveedores',
  'App de inventario', 'Actualización de red', 'Mesa de ayuda', 'Sitio institucional', 'Migración de correo',
  'App de asistencia', 'Análisis de costos en la nube', 'Mantenimiento de la tienda', 'Plataforma de cursos', 'Plan de continuidad',
];

async function sembrar() {
  if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
    throw new Error('Define SEED_PASSWORD (mínimo 8 caracteres) en el archivo .env.');
  }
  await conectarBD(process.env.MONGODB_URI);
  await Proyecto.deleteMany({});
  // sanitizeFilter está activo: el operador $in propio se marca como confiable
  await Usuario.deleteMany({ correo: mongoose.trusted({ $in: CORREOS }) });

  const hash = await bcrypt.hash(process.env.SEED_PASSWORD, 10);
  const ana = await Usuario.create({ nombre: 'Ana Torres', correo: CORREOS[0], password: hash, rol: 'admin' });
  const luis = await Usuario.create({ nombre: 'Luis Ramírez', correo: CORREOS[1], password: hash });

  const proyectos = NOMBRES.map((nombre, i) => ({
    nombre,
    cliente: CLIENTES[i % CLIENTES.length],
    servicio: SERVICIOS[i % SERVICIOS.length],
    presupuesto: 30000 + ((i * 17000) % 260000),
    estado: ESTADOS[i % ESTADOS.length],
    fechaEntrega: new Date(Date.UTC(2026, 11 + (i % 4), 1 + ((i * 3) % 28))),
    descripcion: `Proyecto de ejemplo número ${i + 1} para ${CLIENTES[i % CLIENTES.length]}.`,
    propietario: i % 4 === 0 ? ana._id : luis._id,
  }));
  await Proyecto.insertMany(proyectos);
  console.log(`Datos de ejemplo cargados: 2 usuarios (${CORREOS[0]} es admin) y ${proyectos.length} proyectos.`);
}

sembrar()
  .catch((err) => { console.error(err.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Usuario = require('../../models/Usuario');
const Proyecto = require('../../models/Proyecto');

const PASSWORD = 'Clave-de-pruebas-1';

// Cada archivo de prueba usa su propia base dentro de la misma instancia en memoria.
// Jest ejecuta el código sin soporte de import() dinámico y el controlador de MongoDB 7 lo usa para
// leer los datos del sistema operativo; sin ellos el servidor rechaza la conexión ("Missing required
// sub-document 'driver'"). Se le entrega el módulo os de forma explícita con runtimeAdapters.
async function conectar(nombre) {
  await mongoose.connect(`${process.env.MONGO_URI_PRUEBAS}${nombre}`, { runtimeAdapters: { os: require('os') } });
}
async function desconectar() {
  await limpiar();
  await mongoose.disconnect();
}
async function limpiar() {
  await Promise.all([Usuario.deleteMany({}), Proyecto.deleteMany({})]);
}

function firmar(usuario, opciones = {}) {
  return jwt.sign({ id: usuario._id, correo: usuario.correo, rol: usuario.rol }, opciones.secreto || process.env.JWT_SECRET, {
    expiresIn: opciones.expiresIn || '30m',
  });
}

// Crea un usuario directamente en la base (hash con costo bajo para que las pruebas sean rápidas)
async function crearUsuario(datos = {}) {
  const bcrypt = require('bcryptjs');
  const usuario = await Usuario.create({
    nombre: 'Usuario de prueba',
    correo: `u${new mongoose.Types.ObjectId()}@prueba.example`,
    password: await bcrypt.hash(PASSWORD, 4),
    ...datos,
  });
  return { usuario, token: firmar(usuario) };
}

const proyectoValido = (extra = {}) => ({
  nombre: 'Portal de clientes',
  cliente: 'Grupo Atlas',
  servicio: 'Desarrollo web',
  presupuesto: 150000,
  estado: 'Pendiente',
  ...extra,
});

async function crearProyectos(propietario, cantidad, plantilla = () => ({})) {
  const docs = Array.from({ length: cantidad }, (_, i) => ({ ...proyectoValido({ nombre: `Proyecto ${String(i + 1).padStart(2, '0')}` }), propietario: propietario._id, ...plantilla(i) }));
  return Proyecto.insertMany(docs);
}

module.exports = { conectar, desconectar, limpiar, firmar, crearUsuario, proyectoValido, crearProyectos, PASSWORD };

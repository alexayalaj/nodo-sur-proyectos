const mongoose = require('mongoose');

// Evita que un objeto con operadores ($ne, $gt…) enviado por el cliente se interprete como filtro (inyección NoSQL).
mongoose.set('sanitizeFilter', true);

// Conecta con la base de datos usando la URI de las variables de entorno.
async function conectarBD(uri) {
  if (!uri) {
    throw new Error('Falta la variable de entorno MONGODB_URI.');
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  } catch (err) {
    throw new Error(`No se pudo conectar a MongoDB: ${err.message}`);
  }
}

module.exports = { conectarBD };

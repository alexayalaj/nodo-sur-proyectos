// dotenv se carga antes que cualquier otra dependencia que lea process.env
require('dotenv').config();

const app = require('./app');
const { conectarBD } = require('./config/db');

async function iniciar() {
  if (!process.env.JWT_SECRET) {
    throw new Error('Falta la variable de entorno JWT_SECRET. Copia .env.example como .env y complétala.');
  }
  await conectarBD(process.env.MONGODB_URI);
  const puerto = process.env.PORT || 3000;
  app.listen(puerto, () => {
    console.log(`Base de datos conectada. Servidor escuchando en el puerto ${puerto}`);
  });
}

iniciar().catch((err) => {
  console.error(`No se pudo iniciar el servidor: ${err.message}`);
  process.exit(1);
});

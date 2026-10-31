// Levanta un mongod real (sin instalar MongoDB) con datos persistentes en ./.mongo-data
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  const dbPath = path.join(__dirname, '..', '..', '.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
  });
  console.log(`MongoDB local activo: ${mongod.getUri()}nodo_sur_proyectos`);
  console.log('Usa esta URI en MONGODB_URI: mongodb://127.0.0.1:27017/nodo_sur_proyectos');
  console.log('Presiona Ctrl+C para detenerlo.');
  const detener = async () => { await mongod.stop(); process.exit(0); };
  process.on('SIGINT', detener);
  process.on('SIGTERM', detener);
}

main().catch((err) => { console.error(`No se pudo iniciar MongoDB local: ${err.message}`); process.exit(1); });

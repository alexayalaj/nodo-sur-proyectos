// Levanta una sola instancia de MongoDB en memoria para toda la corrida; cada archivo usa su propia base.
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = mongod;
  process.env.MONGO_URI_PRUEBAS = mongod.getUri();
};

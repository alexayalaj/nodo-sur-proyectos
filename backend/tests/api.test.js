const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '30m';
const app = require('../app');

let mongod;
let servidor;
let base;

// Cliente mínimo con fetch (Node >= 20)
async function pedir(metodo, ruta, { cuerpo, token } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(base + ruta, { method: metodo, headers, body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined });
  return { estado: r.status, json: await r.json() };
}

const proyectoValido = {
  nombre: 'Portal de clientes',
  cliente: 'Grupo Atlas',
  servicio: 'Desarrollo web',
  presupuesto: 150000,
  estado: 'Pendiente',
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('pruebas'));
  servidor = http.createServer(app);
  await new Promise((ok) => servidor.listen(0, ok));
  base = `http://127.0.0.1:${servidor.address().port}`;
});

after(async () => {
  await new Promise((ok) => servidor.close(ok));
  await mongoose.disconnect();
  await mongod.stop();
});

let tokenA;
let tokenB;
let idProyecto;

test('GET /api/salud responde 200', async () => {
  const r = await pedir('GET', '/api/salud');
  assert.equal(r.estado, 200);
  assert.equal(r.json.ok, true);
});

test('registro correcto devuelve 201 y token; no expone la contraseña', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: { nombre: 'Ana Torres', correo: 'Ana@Prueba.com', password: 'clave12345' } });
  assert.equal(r.estado, 201);
  assert.ok(r.json.data.token);
  assert.equal(r.json.data.usuario.correo, 'ana@prueba.com');
  assert.equal(r.json.data.usuario.password, undefined);
  tokenA = r.json.data.token;
  const b = await pedir('POST', '/api/auth/registro', { cuerpo: { nombre: 'Luis Ramírez', correo: 'luis@prueba.com', password: 'clave12345' } });
  tokenB = b.json.data.token;
});

test('registro duplicado devuelve 409', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: { nombre: 'Ana', correo: 'ana@prueba.com', password: 'clave12345' } });
  assert.equal(r.estado, 409);
});

test('registro inválido devuelve 400', async () => {
  const r = await pedir('POST', '/api/auth/registro', { cuerpo: { nombre: 'A', correo: 'no-es-correo', password: '123' } });
  assert.equal(r.estado, 400);
  assert.equal(r.json.errores.length, 3);
});

test('la contraseña se guarda con hash bcrypt', async () => {
  const doc = await mongoose.connection.db.collection('usuarios').findOne({ correo: 'ana@prueba.com' });
  assert.match(doc.password, /^\$2[aby]\$/);
  assert.notEqual(doc.password, 'clave12345');
});

test('login correcto devuelve 200 y token con expiración', async () => {
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'ana@prueba.com', password: 'clave12345' } });
  assert.equal(r.estado, 200);
  const payload = jwt.decode(r.json.data.token);
  assert.ok(payload.exp > payload.iat);
});

test('login con contraseña o correo incorrectos devuelve 401 con mensaje genérico', async () => {
  const a = await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'ana@prueba.com', password: 'incorrecta1' } });
  const b = await pedir('POST', '/api/auth/login', { cuerpo: { correo: 'nadie@prueba.com', password: 'clave12345' } });
  assert.equal(a.estado, 401);
  assert.equal(b.estado, 401);
  assert.equal(a.json.message, b.json.message);
});

test('login rechaza inyección NoSQL {"$gt":""}', async () => {
  const r = await pedir('POST', '/api/auth/login', { cuerpo: { correo: { $gt: '' }, password: { $gt: '' } } });
  assert.equal(r.estado, 400);
});

test('perfil: sin token 401, token inválido 403, token válido 200', async () => {
  assert.equal((await pedir('GET', '/api/auth/perfil')).estado, 401);
  const mal = await pedir('GET', '/api/auth/perfil', { token: 'abc.def.ghi' });
  assert.equal(mal.estado, 403);
  assert.equal(mal.json.codigo, 'TOKEN_INVALIDO');
  const ok = await pedir('GET', '/api/auth/perfil', { token: tokenA });
  assert.equal(ok.estado, 200);
  assert.equal(ok.json.data.correo, 'ana@prueba.com');
});

test('token expirado devuelve 403 TOKEN_INVALIDO', async () => {
  const expirado = jwt.sign({ id: '507f1f77bcf86cd799439011', correo: 'x@x.com' }, process.env.JWT_SECRET, { expiresIn: -10 });
  const r = await pedir('GET', '/api/auth/perfil', { token: expirado });
  assert.equal(r.estado, 403);
  assert.equal(r.json.codigo, 'TOKEN_INVALIDO');
});

test('crear proyecto sin token devuelve 401', async () => {
  const r = await pedir('POST', '/api/proyectos', { cuerpo: proyectoValido });
  assert.equal(r.estado, 401);
});

test('crear proyecto con token inválido devuelve 403', async () => {
  const r = await pedir('POST', '/api/proyectos', { cuerpo: proyectoValido, token: 'falso' });
  assert.equal(r.estado, 403);
});

test('crear proyecto válido devuelve 201 y asigna propietario', async () => {
  const r = await pedir('POST', '/api/proyectos', { cuerpo: proyectoValido, token: tokenA });
  assert.equal(r.estado, 201);
  assert.equal(r.json.data.nombre, 'Portal de clientes');
  assert.ok(r.json.data.propietario);
  idProyecto = r.json.data._id;
});

test('crear proyecto con datos inválidos devuelve 400', async () => {
  const cuerpos = [
    {},
    { ...proyectoValido, presupuesto: -5 },
    { ...proyectoValido, presupuesto: '1000' },
    { ...proyectoValido, servicio: 'Cocina' },
    { ...proyectoValido, estado: 'Cancelado' },
    { ...proyectoValido, nombre: { $gt: '' } },
  ];
  for (const cuerpo of cuerpos) {
    const r = await pedir('POST', '/api/proyectos', { cuerpo, token: tokenA });
    assert.equal(r.estado, 400, JSON.stringify(cuerpo));
  }
});

test('listar y obtener son públicos', async () => {
  const lista = await pedir('GET', '/api/proyectos');
  assert.equal(lista.estado, 200);
  assert.equal(lista.json.data.length, 1);
  const uno = await pedir('GET', `/api/proyectos/${idProyecto}`);
  assert.equal(uno.estado, 200);
  assert.equal(uno.json.data.cliente, 'Grupo Atlas');
});

test('obtener con id mal formado devuelve 400 y con id inexistente 404', async () => {
  assert.equal((await pedir('GET', '/api/proyectos/123')).estado, 400);
  assert.equal((await pedir('GET', '/api/proyectos/507f1f77bcf86cd799439011')).estado, 404);
});

test('actualizar: sin token 401, ajeno 403, propietario 200, inexistente 404, inválido 400', async () => {
  const ruta = `/api/proyectos/${idProyecto}`;
  assert.equal((await pedir('PUT', ruta, { cuerpo: { estado: 'En curso' } })).estado, 401);
  assert.equal((await pedir('PUT', ruta, { cuerpo: { estado: 'En curso' }, token: tokenB })).estado, 403);
  const ok = await pedir('PUT', ruta, { cuerpo: { estado: 'En curso', presupuesto: 175000 }, token: tokenA });
  assert.equal(ok.estado, 200);
  assert.equal(ok.json.data.estado, 'En curso');
  assert.equal(ok.json.data.presupuesto, 175000);
  assert.equal((await pedir('PUT', '/api/proyectos/507f1f77bcf86cd799439011', { cuerpo: { estado: 'En curso' }, token: tokenA })).estado, 404);
  assert.equal((await pedir('PUT', ruta, { cuerpo: { estado: 'Otro' }, token: tokenA })).estado, 400);
  assert.equal((await pedir('PUT', ruta, { cuerpo: {}, token: tokenA })).estado, 400);
});

test('eliminar: sin token 401, ajeno 403, propietario 200 y luego 404', async () => {
  const ruta = `/api/proyectos/${idProyecto}`;
  assert.equal((await pedir('DELETE', ruta)).estado, 401);
  assert.equal((await pedir('DELETE', ruta, { token: tokenB })).estado, 403);
  assert.equal((await pedir('DELETE', ruta, { token: tokenA })).estado, 200);
  assert.equal((await pedir('GET', ruta)).estado, 404);
  assert.equal((await pedir('DELETE', ruta, { token: tokenA })).estado, 404);
});

test('ruta inexistente devuelve 404 en JSON y JSON malformado devuelve 400', async () => {
  const r = await pedir('GET', '/api/no-existe');
  assert.equal(r.estado, 404);
  assert.equal(r.json.ok, false);
  const mal = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{roto' });
  assert.equal(mal.status, 400);
});

test('CORS responde a la petición preflight OPTIONS', async () => {
  const r = await fetch(`${base}/api/proyectos`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://ejemplo.com', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' },
  });
  assert.equal(r.status, 204);
  assert.ok(r.headers.get('access-control-allow-origin'));
});

test('el servidor entrega el frontend', async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Nodo Sur/);
});

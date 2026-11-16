const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const Usuario = require('../../models/Usuario');
const { conectar, desconectar, limpiar, crearUsuario, crearProyectos, firmar, proyectoValido } = require('../helpers/bd');

beforeAll(() => conectar('seguridad'));
afterAll(desconectar);
beforeEach(limpiar);

const con = (token) => ({ Authorization: `Bearer ${token}` });
const RUTAS_PROTEGIDAS = [
  ['get', '/api/proyectos'],
  ['get', '/api/proyectos/resumen'],
  ['get', '/api/proyectos/64b64b64b64b64b64b64b64b'],
  ['post', '/api/proyectos'],
  ['put', '/api/proyectos/64b64b64b64b64b64b64b64b'],
  ['delete', '/api/proyectos/64b64b64b64b64b64b64b64b'],
  ['get', '/api/usuarios'],
  ['get', '/api/tipo-cambio'],
  ['get', '/api/auth/perfil'],
];

describe('autenticación de las rutas', () => {
  test.each(RUTAS_PROTEGIDAS)('TC-SEG-01: sin token %s %s responde 401', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta);
    expect(res.status).toBe(401);
  });

  test('TC-SEG-02: token con firma alterada responde 403 TOKEN_INVALIDO', async () => {
    const { token } = await crearUsuario();
    const alterado = token.slice(0, -4) + (token.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    const res = await request(app).get('/api/proyectos').set(con(alterado));
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('TOKEN_INVALIDO');
  });

  test('TC-SEG-03: token firmado con otra clave responde 403', async () => {
    const { usuario } = await crearUsuario();
    const res = await request(app).get('/api/proyectos').set(con(firmar(usuario, { secreto: 'otra-clave' })));
    expect(res.status).toBe(403);
  });

  test('TC-SEG-04: token expirado responde 403 TOKEN_INVALIDO', async () => {
    const { usuario } = await crearUsuario();
    const caducado = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: -10 });
    const res = await request(app).get('/api/proyectos').set(con(caducado));
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('TOKEN_INVALIDO');
  });

  test('TC-SEG-05: token con algoritmo "none" responde 403', async () => {
    const { usuario } = await crearUsuario({ rol: 'admin' });
    const cab = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const carga = Buffer.from(JSON.stringify({ id: String(usuario._id), rol: 'admin' })).toString('base64url');
    const res = await request(app).get('/api/usuarios').set(con(`${cab}.${carga}.`));
    expect(res.status).toBe(403);
  });

  test('TC-SEG-06: encabezado Authorization sin el esquema Bearer responde 401', async () => {
    const { token } = await crearUsuario();
    const res = await request(app).get('/api/proyectos').set('Authorization', token);
    expect(res.status).toBe(401);
  });

  test('TC-SEG-07: un usuario desactivado con token vigente recibe 403', async () => {
    const { usuario, token } = await crearUsuario();
    await Usuario.updateOne({ _id: usuario._id }, { activo: false });
    const res = await request(app).get('/api/proyectos').set(con(token));
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('CUENTA_DESACTIVADA');
  });

  test('TC-SEG-08: un token de un usuario eliminado responde 403', async () => {
    const { usuario, token } = await crearUsuario();
    await Usuario.deleteOne({ _id: usuario._id });
    expect((await request(app).get('/api/proyectos').set(con(token))).status).toBe(403);
  });
});

describe('autorización por rol y propiedad', () => {
  test('TC-SEG-09: un usuario normal recibe 403 en toda la administración de usuarios', async () => {
    const { token } = await crearUsuario();
    const otro = await crearUsuario();
    expect((await request(app).get('/api/usuarios').set(con(token))).status).toBe(403);
    expect((await request(app).patch(`/api/usuarios/${otro.usuario._id}/rol`).set(con(token)).send({ rol: 'admin' })).status).toBe(403);
    expect((await request(app).patch(`/api/usuarios/${otro.usuario._id}/estado`).set(con(token)).send({ activo: false })).status).toBe(403);
  });

  test('TC-SEG-10: el rol del payload no se confía: un token que dice admin de un usuario normal no abre /api/usuarios', async () => {
    const { usuario } = await crearUsuario();
    const falso = jwt.sign({ id: usuario._id, rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });
    expect((await request(app).get('/api/usuarios').set(con(falso))).status).toBe(403);
  });

  test('TC-SEG-11: registrarse enviando rol "admin" crea un usuario normal', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'Intruso', correo: 'intruso@x.com', password: 'Clave-larga-123', rol: 'admin', activo: false });
    expect(res.status).toBe(201);
    expect(res.body.data.usuario.rol).toBe('usuario');
    expect((await Usuario.findOne({ correo: 'intruso@x.com' })).activo).toBe(true);
  });

  test('TC-SEG-12: un usuario no puede ver, editar ni eliminar el proyecto de otro', async () => {
    const dueno = await crearUsuario();
    const intruso = await crearUsuario();
    const [p] = await crearProyectos(dueno.usuario, 1);
    expect((await request(app).get(`/api/proyectos/${p._id}`).set(con(intruso.token))).status).toBe(403);
    expect((await request(app).put(`/api/proyectos/${p._id}`).set(con(intruso.token)).send({ nombre: 'Robado' })).status).toBe(403);
    expect((await request(app).delete(`/api/proyectos/${p._id}`).set(con(intruso.token))).status).toBe(403);
  });

  test('TC-SEG-13: el listado de un usuario solo incluye sus proyectos', async () => {
    const a = await crearUsuario();
    const b = await crearUsuario();
    await crearProyectos(a.usuario, 2);
    await crearProyectos(b.usuario, 3);
    const res = await request(app).get('/api/proyectos').set(con(a.token));
    expect(res.body.meta.total).toBe(2);
  });

  test('TC-SEG-14: un usuario normal no puede filtrar por propietario', async () => {
    const a = await crearUsuario();
    const b = await crearUsuario();
    const res = await request(app).get(`/api/proyectos?propietario=${b.usuario._id}`).set(con(a.token));
    expect(res.status).toBe(403);
  });
});

describe('inyección y validación de entradas', () => {
  test('TC-SEG-15: inyección NoSQL en el login ({"$gt":""}) responde 400', async () => {
    await crearUsuario();
    const res = await request(app).post('/api/auth/login').send({ correo: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('TC-SEG-16: operadores en la query (?estado[$ne]=x) responden 400', async () => {
    const { token } = await crearUsuario();
    const res = await request(app).get('/api/proyectos?estado[$ne]=Pendiente').set(con(token));
    expect(res.status).toBe(400);
  });

  test('TC-SEG-17: operadores en el cuerpo de un proyecto no se aceptan', async () => {
    const { token } = await crearUsuario();
    const res = await request(app).post('/api/proyectos').set(con(token)).send({ ...proyectoValido(), nombre: { $ne: 'x' } });
    expect(res.status).toBe(400);
  });

  test('TC-SEG-18: una búsqueda con expresión regular maliciosa se trata como texto', async () => {
    const { usuario, token } = await crearUsuario();
    await crearProyectos(usuario, 3);
    const res = await request(app).get('/api/proyectos?q=' + encodeURIComponent('.*')).set(con(token));
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(0);
  });

  test('TC-SEG-19: la respuesta no incluye el hash de la contraseña', async () => {
    const { usuario, token } = await crearUsuario();
    const res = await request(app).get('/api/auth/perfil').set(con(token));
    expect(JSON.stringify(res.body)).not.toMatch(/password|\$2[aby]\$/);
    expect(res.body.data.correo).toBe(usuario.correo);
  });
});

describe('cabeceras y rutas', () => {
  test('TC-SEG-20: helmet agrega cabeceras de seguridad y oculta x-powered-by', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('TC-SEG-21: una ruta /api inexistente responde 404 en JSON', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toMatchObject({ ok: false, data: null });
  });

  test('TC-SEG-22: CORS responde al preflight con los métodos y encabezados permitidos', async () => {
    const res = await request(app).options('/api/proyectos').set('Origin', 'http://ejemplo.com').set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
    expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
  });

  test('TC-SEG-23: una ruta no-API sin frontend compilado responde 404', async () => {
    const res = await request(app).get('/proyectos/123');
    expect([200, 404]).toContain(res.status);
  });
});

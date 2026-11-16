const request = require('supertest');
const app = require('../../app');
const Usuario = require('../../models/Usuario');
const { conectar, desconectar, limpiar, crearUsuario, PASSWORD } = require('../helpers/bd');

beforeAll(() => conectar('auth'));
afterAll(desconectar);
beforeEach(limpiar);

const registroValido = { nombre: 'Ana Torres', correo: 'Ana@Correo.com', password: 'Contraseña-segura-1' };

describe('autenticación', () => {
  test('TC-AUTH-01: registro correcto responde 201 con token y rol usuario', async () => {
    const res = await request(app).post('/api/auth/registro').send(registroValido);
    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.usuario).toMatchObject({ correo: 'ana@correo.com', rol: 'usuario' });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test('TC-AUTH-02: la contraseña se guarda con hash bcrypt', async () => {
    await request(app).post('/api/auth/registro').send(registroValido);
    const guardado = await Usuario.findOne({ correo: 'ana@correo.com' }).select('+password');
    expect(guardado.password).not.toBe(registroValido.password);
    expect(guardado.password).toMatch(/^\$2[aby]\$/);
  });

  test('TC-AUTH-03: correo repetido responde 409', async () => {
    await request(app).post('/api/auth/registro').send(registroValido);
    const res = await request(app).post('/api/auth/registro').send(registroValido);
    expect(res.status).toBe(409);
  });

  test('TC-AUTH-04: registro con datos inválidos responde 400 con errores por campo', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'A', correo: 'no-es-correo', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errores).toHaveLength(3);
  });

  test('TC-AUTH-05: login correcto responde 200 con token', async () => {
    const { usuario } = await crearUsuario();
    const res = await request(app).post('/api/auth/login').send({ correo: usuario.correo, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('TC-AUTH-06: contraseña incorrecta y correo inexistente dan el mismo 401 genérico', async () => {
    const { usuario } = await crearUsuario();
    const a = await request(app).post('/api/auth/login').send({ correo: usuario.correo, password: 'otra-clave-123' });
    const b = await request(app).post('/api/auth/login').send({ correo: 'nadie@x.com', password: 'otra-clave-123' });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.body.message).toBe(b.body.message);
  });

  test('TC-AUTH-07: login con usuario desactivado responde 403', async () => {
    const { usuario } = await crearUsuario({ activo: false });
    const res = await request(app).post('/api/auth/login').send({ correo: usuario.correo, password: PASSWORD });
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe('CUENTA_DESACTIVADA');
  });

  test('TC-AUTH-08: perfil con token válido devuelve el usuario y su rol', async () => {
    const { usuario, token } = await crearUsuario({ rol: 'admin' });
    const res = await request(app).get('/api/auth/perfil').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ correo: usuario.correo, rol: 'admin' });
  });

  test('TC-AUTH-09: el token firmado lleva el rol en el payload', async () => {
    const { usuario } = await crearUsuario({ rol: 'admin' });
    const res = await request(app).post('/api/auth/login').send({ correo: usuario.correo, password: PASSWORD });
    const payload = JSON.parse(Buffer.from(res.body.data.token.split('.')[1], 'base64url').toString());
    expect(payload.rol).toBe('admin');
  });

  test('TC-AUTH-10: GET /api/salud es público', async () => {
    const res = await request(app).get('/api/salud');
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('activo');
  });
});

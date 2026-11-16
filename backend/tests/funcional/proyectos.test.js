const request = require('supertest');
const app = require('../../app');
const { conectar, desconectar, limpiar, crearUsuario, proyectoValido, crearProyectos } = require('../helpers/bd');

beforeAll(() => conectar('proyectos'));
afterAll(desconectar);
beforeEach(limpiar);

const con = (token) => ({ Authorization: `Bearer ${token}` });

describe('CRUD de proyectos', () => {
  test('TC-PRO-01: crear responde 201 y asigna al usuario como propietario', async () => {
    const { usuario, token } = await crearUsuario();
    const res = await request(app).post('/api/proyectos').set(con(token)).send(proyectoValido());
    expect(res.status).toBe(201);
    expect(String(res.body.data.propietario)).toBe(String(usuario._id));
  });

  test('TC-PRO-02: el propietario enviado en el cuerpo se ignora', async () => {
    const { usuario, token } = await crearUsuario();
    const otro = await crearUsuario();
    const res = await request(app).post('/api/proyectos').set(con(token)).send({ ...proyectoValido(), propietario: String(otro.usuario._id) });
    expect(String(res.body.data.propietario)).toBe(String(usuario._id));
  });

  test('TC-PRO-03: crear con datos inválidos responde 400 con errores por campo', async () => {
    const { token } = await crearUsuario();
    const res = await request(app).post('/api/proyectos').set(con(token)).send({ nombre: 'x', cliente: '', servicio: 'Otro', presupuesto: -5 });
    expect(res.status).toBe(400);
    expect(res.body.errores.map((e) => e.campo).sort()).toEqual(['cliente', 'nombre', 'presupuesto', 'servicio']);
  });

  test('TC-PRO-04: obtener un proyecto propio responde 200', async () => {
    const { usuario, token } = await crearUsuario();
    const [p] = await crearProyectos(usuario, 1);
    const res = await request(app).get(`/api/proyectos/${p._id}`).set(con(token));
    expect(res.status).toBe(200);
    expect(res.body.data.nombre).toBe('Proyecto 01');
  });

  test('TC-PRO-05: un identificador inexistente responde 404 y uno mal formado 400', async () => {
    const { token } = await crearUsuario();
    expect((await request(app).get('/api/proyectos/64b64b64b64b64b64b64b64b').set(con(token))).status).toBe(404);
    expect((await request(app).get('/api/proyectos/abc').set(con(token))).status).toBe(400);
  });

  test('TC-PRO-06: editar un proyecto propio responde 200 y conserva el resto de los campos', async () => {
    const { usuario, token } = await crearUsuario();
    const [p] = await crearProyectos(usuario, 1);
    const res = await request(app).put(`/api/proyectos/${p._id}`).set(con(token)).send({ estado: 'En curso' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ estado: 'En curso', cliente: 'Grupo Atlas' });
  });

  test('TC-PRO-07: editar con cuerpo vacío responde 400', async () => {
    const { usuario, token } = await crearUsuario();
    const [p] = await crearProyectos(usuario, 1);
    const res = await request(app).put(`/api/proyectos/${p._id}`).set(con(token)).send({});
    expect(res.status).toBe(400);
  });

  test('TC-PRO-08: eliminar un proyecto propio responde 200 y desaparece', async () => {
    const { usuario, token } = await crearUsuario();
    const [p] = await crearProyectos(usuario, 1);
    expect((await request(app).delete(`/api/proyectos/${p._id}`).set(con(token))).status).toBe(200);
    expect((await request(app).get(`/api/proyectos/${p._id}`).set(con(token))).status).toBe(404);
  });

  test('TC-PRO-09: el resumen cuenta por estado y suma el presupuesto del usuario', async () => {
    const { usuario, token } = await crearUsuario();
    const otro = await crearUsuario();
    await crearProyectos(usuario, 3, (i) => ({ estado: ['Pendiente', 'En curso', 'En curso'][i], presupuesto: 1000 }));
    await crearProyectos(otro.usuario, 2);
    const res = await request(app).get('/api/proyectos/resumen').set(con(token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ total: 3, porEstado: { Pendiente: 1, 'En curso': 2, Completado: 0 }, presupuestoTotal: 3000 });
  });

  test('TC-PRO-10: JSON mal formado en el cuerpo responde 400', async () => {
    const { token } = await crearUsuario();
    const res = await request(app).post('/api/proyectos').set(con(token)).set('Content-Type', 'application/json').send('{"nombre": ');
    expect(res.status).toBe(400);
  });
});

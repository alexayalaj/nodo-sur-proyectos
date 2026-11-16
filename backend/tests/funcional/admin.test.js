const request = require('supertest');
const app = require('../../app');
const Usuario = require('../../models/Usuario');
const { conectar, desconectar, limpiar, crearUsuario, crearProyectos, PASSWORD } = require('../helpers/bd');

beforeAll(() => conectar('admin'));
afterAll(desconectar);
beforeEach(limpiar);

const con = (token) => ({ Authorization: `Bearer ${token}` });

describe('administración de usuarios y alcance del administrador', () => {
  test('TC-ADM-01: el administrador lista usuarios con paginación', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    await Promise.all([crearUsuario(), crearUsuario(), crearUsuario()]);
    const res = await request(app).get('/api/usuarios?pagina=1&limite=2').set(con(admin.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ pagina: 1, limite: 2, total: 4, totalPaginas: 2 });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });

  test('TC-ADM-02: el administrador cambia el rol de otro usuario', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const otro = await crearUsuario();
    const res = await request(app).patch(`/api/usuarios/${otro.usuario._id}/rol`).set(con(admin.token)).send({ rol: 'admin' });
    expect(res.status).toBe(200);
    expect((await Usuario.findById(otro.usuario._id)).rol).toBe('admin');
  });

  test('TC-ADM-03: un rol inválido responde 400', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const otro = await crearUsuario();
    const res = await request(app).patch(`/api/usuarios/${otro.usuario._id}/rol`).set(con(admin.token)).send({ rol: 'superadmin' });
    expect(res.status).toBe(400);
  });

  test('TC-ADM-04: el administrador no puede quitarse a sí mismo el rol ni desactivarse', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const a = await request(app).patch(`/api/usuarios/${admin.usuario._id}/rol`).set(con(admin.token)).send({ rol: 'usuario' });
    const b = await request(app).patch(`/api/usuarios/${admin.usuario._id}/estado`).set(con(admin.token)).send({ activo: false });
    expect(a.status).toBe(400);
    expect(b.status).toBe(400);
    expect((await Usuario.findById(admin.usuario._id)).rol).toBe('admin');
  });

  test('TC-ADM-05: desactivar a un usuario le impide iniciar sesión y usar su token', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const otro = await crearUsuario();
    const res = await request(app).patch(`/api/usuarios/${otro.usuario._id}/estado`).set(con(admin.token)).send({ activo: false });
    expect(res.status).toBe(200);
    expect((await request(app).post('/api/auth/login').send({ correo: otro.usuario.correo, password: PASSWORD })).status).toBe(403);
    expect((await request(app).get('/api/proyectos').set(con(otro.token))).status).toBe(403);
  });

  test('TC-ADM-06: reactivar al usuario le devuelve el acceso', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const otro = await crearUsuario({ activo: false });
    await request(app).patch(`/api/usuarios/${otro.usuario._id}/estado`).set(con(admin.token)).send({ activo: true });
    expect((await request(app).get('/api/proyectos').set(con(otro.token))).status).toBe(200);
  });

  test('TC-ADM-07: usuario inexistente responde 404 y estado no booleano 400', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const otro = await crearUsuario();
    expect((await request(app).patch('/api/usuarios/64b64b64b64b64b64b64b64b/rol').set(con(admin.token)).send({ rol: 'admin' })).status).toBe(404);
    expect((await request(app).patch(`/api/usuarios/${otro.usuario._id}/estado`).set(con(admin.token)).send({ activo: 'no' })).status).toBe(400);
  });

  test('TC-ADM-08: el administrador ve los proyectos de todos y puede filtrar por propietario', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const a = await crearUsuario();
    const b = await crearUsuario();
    await crearProyectos(a.usuario, 3);
    await crearProyectos(b.usuario, 2);
    const todos = await request(app).get('/api/proyectos').set(con(admin.token));
    expect(todos.body.meta.total).toBe(5);
    const deB = await request(app).get(`/api/proyectos?propietario=${b.usuario._id}`).set(con(admin.token));
    expect(deB.body.meta.total).toBe(2);
  });

  test('TC-ADM-09: el administrador consulta, edita y elimina un proyecto ajeno', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const dueno = await crearUsuario();
    const [p] = await crearProyectos(dueno.usuario, 1);
    expect((await request(app).get(`/api/proyectos/${p._id}`).set(con(admin.token))).status).toBe(200);
    const edit = await request(app).put(`/api/proyectos/${p._id}`).set(con(admin.token)).send({ estado: 'Completado' });
    expect(edit.status).toBe(200);
    expect(String(edit.body.data.propietario)).toBe(String(dueno.usuario._id));
    expect((await request(app).delete(`/api/proyectos/${p._id}`).set(con(admin.token))).status).toBe(200);
  });

  test('TC-ADM-10: el resumen del administrador abarca todos los proyectos', async () => {
    const admin = await crearUsuario({ rol: 'admin' });
    const a = await crearUsuario();
    await crearProyectos(a.usuario, 4);
    const res = await request(app).get('/api/proyectos/resumen').set(con(admin.token));
    expect(res.body.data.total).toBe(4);
  });
});

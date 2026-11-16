const request = require('supertest');
const app = require('../../app');
const { conectar, desconectar, limpiar, crearUsuario, crearProyectos } = require('../helpers/bd');

let usuario;
let token;
const con = () => ({ Authorization: `Bearer ${token}` });

beforeAll(async () => {
  await conectar('paginacion');
  await limpiar();
  ({ usuario, token } = await crearUsuario());
  await crearProyectos(usuario, 12, (i) => ({
    estado: ['Pendiente', 'En curso', 'Completado'][i % 3],
    servicio: i < 4 ? 'Consultoría TI' : 'Desarrollo web',
    cliente: i === 5 ? 'Café (Sur) 100%' : 'Grupo Atlas',
    presupuesto: (i + 1) * 1000,
  }));
});
afterAll(desconectar);

describe('filtros, orden y paginación', () => {
  test('TC-PAG-01: la primera página trae el límite pedido y la meta correcta', async () => {
    const res = await request(app).get('/api/proyectos?pagina=1&limite=5').set(con());
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toEqual({ pagina: 1, limite: 5, total: 12, totalPaginas: 3 });
  });

  test('TC-PAG-02: la última página trae el resto', async () => {
    const res = await request(app).get('/api/proyectos?pagina=3&limite=5').set(con());
    expect(res.body.data).toHaveLength(2);
  });

  test('TC-PAG-03: una página fuera de rango devuelve lista vacía con la meta', async () => {
    const res = await request(app).get('/api/proyectos?pagina=9&limite=5').set(con());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(12);
  });

  test('TC-PAG-04: las páginas no repiten ni omiten proyectos', async () => {
    const ids = [];
    for (const pagina of [1, 2, 3]) {
      const res = await request(app).get(`/api/proyectos?pagina=${pagina}&limite=5&orden=nombre`).set(con());
      ids.push(...res.body.data.map((p) => p._id));
    }
    expect(new Set(ids).size).toBe(12);
  });

  test('TC-PAG-05: sin parámetros usa la página 1 y el límite 10', async () => {
    const res = await request(app).get('/api/proyectos').set(con());
    expect(res.body.meta).toMatchObject({ pagina: 1, limite: 10, total: 12, totalPaginas: 2 });
  });

  test('TC-PAG-06: límite mayor a 50, cero o texto responde 400', async () => {
    for (const limite of ['51', '0', 'abc', '-1']) {
      expect((await request(app).get(`/api/proyectos?limite=${limite}`).set(con())).status).toBe(400);
    }
  });

  test('TC-PAG-07: filtra por estado y la meta refleja el total filtrado', async () => {
    const res = await request(app).get('/api/proyectos?estado=Completado').set(con());
    expect(res.body.meta.total).toBe(4);
    expect(res.body.data.every((p) => p.estado === 'Completado')).toBe(true);
  });

  test('TC-PAG-08: filtra por servicio', async () => {
    const res = await request(app).get('/api/proyectos?servicio=' + encodeURIComponent('Consultoría TI')).set(con());
    expect(res.body.meta.total).toBe(4);
  });

  test('TC-PAG-09: combina estado, búsqueda y orden descendente por presupuesto', async () => {
    const res = await request(app).get('/api/proyectos?estado=Pendiente&q=proyecto&orden=-presupuesto').set(con());
    const presupuestos = res.body.data.map((p) => p.presupuesto);
    expect(presupuestos.length).toBe(4);
    expect(presupuestos).toEqual([...presupuestos].sort((a, b) => b - a));
  });

  test('TC-PAG-10: la búsqueda no distingue mayúsculas y busca también en el cliente', async () => {
    const res = await request(app).get('/api/proyectos?q=GRUPO%20atlas').set(con());
    expect(res.body.meta.total).toBe(11);
  });

  test('TC-PAG-11: los caracteres especiales de la búsqueda se tratan como texto', async () => {
    const res = await request(app).get('/api/proyectos?q=' + encodeURIComponent('Café (Sur) 100%')).set(con());
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
  });

  test('TC-PAG-12: un orden fuera de la lista blanca responde 400', async () => {
    expect((await request(app).get('/api/proyectos?orden=password').set(con())).status).toBe(400);
  });

  test('TC-PAG-13: ordena de forma ascendente por nombre', async () => {
    const res = await request(app).get('/api/proyectos?orden=nombre&limite=3').set(con());
    expect(res.body.data.map((p) => p.nombre)).toEqual(['Proyecto 01', 'Proyecto 02', 'Proyecto 03']);
  });
});

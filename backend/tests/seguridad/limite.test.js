// El máximo de intentos se fija antes de cargar la aplicación
process.env.LIMITE_INTENTOS = '3';

const request = require('supertest');
const app = require('../../app');
const { conectar, desconectar, limpiar } = require('../helpers/bd');

beforeAll(async () => { await conectar('limite'); await limpiar(); });
afterAll(desconectar);

describe('límite de intentos', () => {
  test('TC-SEG-24: al superar el máximo el login responde 429 con mensaje claro', async () => {
    const intento = () => request(app).post('/api/auth/login').send({ correo: 'nadie@x.com', password: 'cualquiera-123' });
    for (let i = 0; i < 3; i += 1) expect((await intento()).status).toBe(401);
    const bloqueado = await intento();
    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.message).toMatch(/Demasiados intentos/);
  });

  test('TC-SEG-25: el registro comparte el límite', async () => {
    const res = await request(app).post('/api/auth/registro').send({ nombre: 'Ana', correo: 'ana@x.com', password: 'Clave-larga-123' });
    expect(res.status).toBe(429);
  });

  test('TC-SEG-26: el resto de la API no queda bloqueado', async () => {
    expect((await request(app).get('/api/salud')).status).toBe(200);
  });
});

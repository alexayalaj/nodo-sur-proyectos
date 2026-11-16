const request = require('supertest');
const app = require('../../app');
const { limpiarCache } = require('../../services/tipoCambio');
const { conectar, desconectar, limpiar, crearUsuario } = require('../helpers/bd');

let token;
beforeAll(async () => {
  await conectar('tipocambio');
  await limpiar();
  ({ token } = await crearUsuario());
});
afterAll(desconectar);
beforeEach(() => limpiarCache());
afterEach(() => jest.restoreAllMocks());

// Solo se simula la llamada a Frankfurter; las peticiones de supertest usan http real.
function simularFrankfurter(impl) {
  const original = global.fetch;
  return jest.spyOn(global, 'fetch').mockImplementation((url, ...resto) => (String(url).includes('frankfurter') ? impl(url) : original(url, ...resto)));
}
const ok = (rates) => async () => ({ ok: true, status: 200, json: async () => ({ amount: 1, base: 'MXN', date: '2026-11-13', rates }) });

describe('GET /api/tipo-cambio', () => {
  test('TC-API-10: responde 200 con las tasas y la fuente', async () => {
    simularFrankfurter(ok({ EUR: 0.048664, USD: 0.053784 }));
    const res = await request(app).get('/api/tipo-cambio?monedas=USD,EUR').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ base: 'MXN', fuente: 'Frankfurter', tasas: { USD: 0.053784, EUR: 0.048664 } });
  });

  test('TC-API-11: sin monedas usa USD y EUR', async () => {
    const espia = simularFrankfurter(ok({ EUR: 0.05, USD: 0.05 }));
    const res = await request(app).get('/api/tipo-cambio').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(String(espia.mock.calls[0][0])).toContain('symbols=EUR,USD');
  });

  test('TC-API-12: una moneda fuera de la lista blanca responde 400 sin llamar a la API', async () => {
    const espia = simularFrankfurter(ok({}));
    const res = await request(app).get('/api/tipo-cambio?monedas=USD,XYZ').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(espia).not.toHaveBeenCalled();
  });

  test('TC-API-13: sin token responde 401', async () => {
    expect((await request(app).get('/api/tipo-cambio')).status).toBe(401);
  });

  test('TC-API-14: si la API externa cae, responde 502 con mensaje claro', async () => {
    simularFrankfurter(async () => { throw new TypeError('fetch failed'); });
    const res = await request(app).get('/api/tipo-cambio?monedas=USD').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(502);
    expect(res.body.message).toMatch(/tipo de cambio/);
  });

  test('TC-API-15: si la API externa tarda demasiado, responde 504', async () => {
    simularFrankfurter(async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; });
    const res = await request(app).get('/api/tipo-cambio?monedas=USD').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(504);
  });
});

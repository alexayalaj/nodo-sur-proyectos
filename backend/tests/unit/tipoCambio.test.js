const { obtenerTipoCambio, limpiarCache } = require('../../services/tipoCambio');

const respuestaOk = (rates, extra = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({ amount: 1, base: 'MXN', date: '2026-11-13', rates, ...extra }),
});

let espia;
beforeEach(() => {
  limpiarCache();
  espia = jest.spyOn(global, 'fetch');
});
afterEach(() => jest.restoreAllMocks());

describe('servicio de tipo de cambio (API externa simulada)', () => {
  test('TC-API-01: devuelve base, fecha y tasas de las monedas pedidas', async () => {
    espia.mockResolvedValue(respuestaOk({ EUR: 0.048664, USD: 0.053784 }));
    const r = await obtenerTipoCambio(['USD', 'EUR']);
    expect(r).toEqual({ base: 'MXN', fecha: '2026-11-13', tasas: { EUR: 0.048664, USD: 0.053784 }, cache: false });
    expect(espia.mock.calls[0][0]).toContain('base=MXN&symbols=EUR,USD');
  });

  test('TC-API-02: la segunda consulta usa la caché y no llama a la API', async () => {
    espia.mockResolvedValue(respuestaOk({ USD: 0.05 }));
    await obtenerTipoCambio(['USD']);
    const r = await obtenerTipoCambio(['USD']);
    expect(r.cache).toBe(true);
    expect(espia).toHaveBeenCalledTimes(1);
  });

  test('TC-API-03: la caché vence después de una hora', async () => {
    espia.mockResolvedValue(respuestaOk({ USD: 0.05 }));
    const ahora = Date.now();
    const reloj = jest.spyOn(Date, 'now').mockReturnValue(ahora);
    await obtenerTipoCambio(['USD']);
    reloj.mockReturnValue(ahora + 61 * 60 * 1000);
    await obtenerTipoCambio(['USD']);
    expect(espia).toHaveBeenCalledTimes(2);
  });

  test('TC-API-04: tiempo agotado se convierte en error 504', async () => {
    const err = new Error('timeout');
    err.name = 'TimeoutError';
    espia.mockRejectedValue(err);
    await expect(obtenerTipoCambio(['USD'])).rejects.toMatchObject({ status: 504 });
  });

  test('TC-API-05: fallo de red se convierte en error 502', async () => {
    espia.mockRejectedValue(new TypeError('fetch failed'));
    await expect(obtenerTipoCambio(['USD'])).rejects.toMatchObject({ status: 502, expuesto: true });
  });

  test('TC-API-06: respuesta con estado de error se convierte en 502', async () => {
    espia.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(obtenerTipoCambio(['USD'])).rejects.toMatchObject({ status: 502 });
  });

  test('TC-API-07: JSON ilegible se convierte en 502', async () => {
    espia.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new SyntaxError('x'); } });
    await expect(obtenerTipoCambio(['USD'])).rejects.toMatchObject({ status: 502 });
  });

  test('TC-API-08: respuesta con forma inválida (falta una tasa) se convierte en 502', async () => {
    espia.mockResolvedValue(respuestaOk({ USD: 0.05 }));
    await expect(obtenerTipoCambio(['USD', 'EUR'])).rejects.toMatchObject({ status: 502 });
  });

  test('TC-API-09: tasa no numérica se rechaza', async () => {
    espia.mockResolvedValue(respuestaOk({ USD: 'mucho' }));
    await expect(obtenerTipoCambio(['USD'])).rejects.toMatchObject({ status: 502 });
  });
});

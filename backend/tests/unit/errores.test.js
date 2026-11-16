const { manejadorErrores, noEncontrado } = require('../../middleware/errores');
const logger = require('../../middleware/logger');

function resSimulada(extra = {}) {
  return { headersSent: false, status: jest.fn().mockReturnThis(), json: jest.fn(), ...extra };
}

describe('middleware de errores', () => {
  test('TC-ERR-01: ruta inexistente responde 404 en JSON', () => {
    const res = resSimulada();
    noEncontrado({ method: 'GET', originalUrl: '/api/x' }, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json.mock.calls[0][0]).toMatchObject({ ok: false, data: null });
  });

  test('TC-ERR-02: error de validación de Mongoose responde 400', () => {
    const res = resSimulada();
    manejadorErrores({ name: 'ValidationError', errors: { a: { message: 'Falta a.' } } }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-ERR-03: CastError responde 400 y clave duplicada responde 409', () => {
    const r1 = resSimulada();
    manejadorErrores({ name: 'CastError' }, {}, r1, jest.fn());
    expect(r1.status).toHaveBeenCalledWith(400);
    const r2 = resSimulada();
    manejadorErrores({ code: 11000 }, {}, r2, jest.fn());
    expect(r2.status).toHaveBeenCalledWith(409);
  });

  test('TC-ERR-04: JSON mal formado responde 400', () => {
    const res = resSimulada();
    manejadorErrores({ type: 'entity.parse.failed' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-ERR-05: con la cabecera ya enviada delega en next (headers already sent)', () => {
    const res = resSimulada({ headersSent: true });
    const next = jest.fn();
    const err = new Error('x');
    manejadorErrores(err, {}, res, next);
    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('TC-ERR-06: en producción un error 500 interno no revela el mensaje ni el stack', () => {
    const previo = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = resSimulada();
    manejadorErrores(new Error('detalle interno'), {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('detalle interno');
    consola.mockRestore();
    process.env.NODE_ENV = previo;
  });

  test('TC-ERR-07: un error expuesto (502) conserva su mensaje en producción', () => {
    const previo = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    const consola = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = resSimulada();
    manejadorErrores({ status: 502, expuesto: true, message: 'Servicio caído.' }, {}, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json.mock.calls[0][0].message).toBe('Servicio caído.');
    consola.mockRestore();
    process.env.NODE_ENV = previo;
  });
});

describe('logger', () => {
  test('TC-LOG-01: registra método, ruta, estado y duración sin cuerpo ni token', () => {
    const previo = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const consola = jest.spyOn(console, 'log').mockImplementation(() => {});
    let alTerminar;
    const res = { statusCode: 201, on: (_, fn) => { alTerminar = fn; } };
    const req = { method: 'POST', originalUrl: '/api/proyectos?q=secreto', headers: { authorization: 'Bearer abc' }, body: { password: 'x' } };
    const next = jest.fn();
    logger(req, res, next);
    alTerminar();
    const linea = consola.mock.calls[0][0];
    expect(next).toHaveBeenCalled();
    expect(linea).toMatch(/POST \/api\/proyectos 201 [\d.]+ms/);
    expect(linea).not.toContain('abc');
    expect(linea).not.toContain('secreto');
    consola.mockRestore();
    process.env.NODE_ENV = previo;
  });
});

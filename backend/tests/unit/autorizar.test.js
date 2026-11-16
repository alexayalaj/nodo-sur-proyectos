const { autorizar } = require('../../middleware/autorizar');

function simular(usuario) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  return { req: { usuario }, res, next };
}

describe('middleware autorizar', () => {
  test('TC-ROL-01: deja pasar a un rol permitido', () => {
    const { req, res, next } = simular({ rol: 'admin' });
    autorizar('admin')(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('TC-ROL-02: responde 403 a un rol no permitido', () => {
    const { req, res, next } = simular({ rol: 'usuario' });
    autorizar('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('TC-ROL-03: acepta varios roles', () => {
    const { req, res, next } = simular({ rol: 'usuario' });
    autorizar('admin', 'usuario')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  test('TC-ROL-04: sin usuario en la petición responde 403', () => {
    const { req, res, next } = simular(undefined);
    autorizar('admin')(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

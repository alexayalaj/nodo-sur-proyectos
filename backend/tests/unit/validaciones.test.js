const { validarRegistro, validarProyecto, validarId, validarConsultaProyectos } = require('../../middleware/validaciones');

// Ejecuta la cadena de validaciones de express-validator contra una petición simulada
async function correr(cadena, req) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  let siguiente = false;
  const base = { body: {}, query: {}, params: {}, ...req };
  for (const paso of cadena) {
    if (siguiente === 'detenido') break;
    if (typeof paso.run === 'function') {
      await paso.run(base);
    } else {
      await new Promise((ok) => {
        const resultado = paso(base, res, () => { siguiente = true; ok(); });
        if (res.json.mock.calls.length) { siguiente = 'detenido'; ok(); }
        return resultado;
      });
    }
  }
  return { res, aprobo: siguiente === true };
}

describe('validaciones con express-validator', () => {
  test('TC-VAL-01: registro válido continúa', async () => {
    const { aprobo } = await correr(validarRegistro, { body: { nombre: 'Ana', correo: 'ana@x.com', password: '12345678' } });
    expect(aprobo).toBe(true);
  });

  test('TC-VAL-02: registro inválido responde 400 con errores por campo', async () => {
    const { res } = await correr(validarRegistro, { body: { nombre: 'A', correo: 'no', password: '1' } });
    expect(res.status).toHaveBeenCalledWith(400);
    const cuerpo = res.json.mock.calls[0][0];
    expect(cuerpo.errores.map((e) => e.campo).sort()).toEqual(['correo', 'nombre', 'password']);
  });

  test('TC-VAL-03: un objeto en lugar de texto se rechaza (bloquea {"$gt":""})', async () => {
    const { res } = await correr(validarRegistro, { body: { nombre: 'Ana', correo: { $gt: '' }, password: '12345678' } });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-VAL-04: el presupuesto como texto se rechaza', async () => {
    const cuerpo = { nombre: 'Portal', cliente: 'Atlas', servicio: 'Desarrollo web', presupuesto: '100' };
    const { res } = await correr(validarProyecto(true), { body: cuerpo });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].errores[0].campo).toBe('presupuesto');
  });

  test('TC-VAL-05: la edición vacía se rechaza', async () => {
    const { res } = await correr(validarProyecto(false), { body: {} });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-VAL-06: un identificador que no es ObjectId se rechaza', async () => {
    const { res } = await correr(validarId, { params: { id: '123' } });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('TC-VAL-07: el límite máximo de paginación es 50', async () => {
    const mal = await correr(validarConsultaProyectos, { query: { limite: '51' } });
    expect(mal.res.status).toHaveBeenCalledWith(400);
    const bien = await correr(validarConsultaProyectos, { query: { limite: '50', pagina: '2' } });
    expect(bien.aprobo).toBe(true);
  });
});

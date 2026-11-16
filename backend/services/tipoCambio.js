// Consulta el tipo de cambio del peso mexicano (MXN) a otras monedas en la API pública Frankfurter.
const MONEDAS_PERMITIDAS = ['USD', 'EUR', 'CAD', 'GBP', 'JPY', 'CHF', 'AUD', 'BRL'];
const BASE = 'MXN';
const TIEMPO_ESPERA_MS = 5000;
const VIGENCIA_CACHE_MS = 60 * 60 * 1000;

const cache = new Map();

function urlBase() {
  return (process.env.FRANKFURTER_URL || 'https://api.frankfurter.dev/v1').replace(/\/+$/, '');
}

function errorExterno(status, mensaje) {
  const err = new Error(mensaje);
  err.status = status;
  err.expuesto = true; // el mensaje es seguro de mostrar al cliente
  return err;
}

function limpiarCache() {
  cache.clear();
}

// Devuelve { base, fecha, tasas } para las monedas pedidas. Lanza errores con status 502 o 504.
async function obtenerTipoCambio(monedas) {
  const lista = [...new Set(monedas)].sort();
  const clave = lista.join(',');
  const guardado = cache.get(clave);
  if (guardado && Date.now() - guardado.momento < VIGENCIA_CACHE_MS) {
    return { ...guardado.datos, cache: true };
  }

  let respuesta;
  try {
    respuesta = await fetch(`${urlBase()}/latest?base=${BASE}&symbols=${clave}`, {
      signal: AbortSignal.timeout(TIEMPO_ESPERA_MS),
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw errorExterno(504, 'El servicio de tipo de cambio tardó demasiado en responder. Intenta de nuevo.');
    }
    throw errorExterno(502, 'No se pudo contactar al servicio de tipo de cambio.');
  }
  if (!respuesta.ok) {
    throw errorExterno(502, 'El servicio de tipo de cambio respondió con un error.');
  }

  let cuerpo;
  try {
    cuerpo = await respuesta.json();
  } catch (err) {
    throw errorExterno(502, 'El servicio de tipo de cambio devolvió una respuesta no válida.');
  }
  const tasas = cuerpo && cuerpo.rates;
  const valida =
    cuerpo && cuerpo.base === BASE && typeof cuerpo.date === 'string' && tasas && typeof tasas === 'object' &&
    lista.every((m) => typeof tasas[m] === 'number' && Number.isFinite(tasas[m]) && tasas[m] > 0);
  if (!valida) {
    throw errorExterno(502, 'El servicio de tipo de cambio devolvió una respuesta no válida.');
  }

  const datos = { base: BASE, fecha: cuerpo.date, tasas: Object.fromEntries(lista.map((m) => [m, tasas[m]])) };
  cache.set(clave, { momento: Date.now(), datos });
  return { ...datos, cache: false };
}

module.exports = { obtenerTipoCambio, limpiarCache, MONEDAS_PERMITIDAS, TIEMPO_ESPERA_MS };

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const formatoMXN = (n) => moneda.format(n || 0);

export const formatoOtraMoneda = (n, codigo) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: codigo, maximumFractionDigits: 2 }).format(n);

// Las fechas llegan en UTC (medianoche); se muestran en UTC para que no cambien de día
export const formatoFecha = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fecha';

export const valorFecha = (iso) => (iso ? String(iso).slice(0, 10) : '');

export const SERVICIOS = ['Desarrollo web', 'Aplicaciones móviles', 'Consultoría TI', 'Infraestructura y nube', 'Soporte y mantenimiento'];
export const ESTADOS = ['Pendiente', 'En curso', 'Completado'];
export const MONEDAS = ['USD', 'EUR', 'CAD', 'GBP', 'JPY'];
export const ORDENES = [
  { valor: '-createdAt', texto: 'Más recientes' },
  { valor: 'createdAt', texto: 'Más antiguos' },
  { valor: 'nombre', texto: 'Nombre (A-Z)' },
  { valor: '-nombre', texto: 'Nombre (Z-A)' },
  { valor: '-presupuesto', texto: 'Mayor presupuesto' },
  { valor: 'presupuesto', texto: 'Menor presupuesto' },
  { valor: 'fechaEntrega', texto: 'Entrega más próxima' },
];

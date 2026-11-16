const mongoose = require('mongoose');

const SERVICIOS = ['Desarrollo web', 'Aplicaciones móviles', 'Consultoría TI', 'Infraestructura y nube', 'Soporte y mantenimiento'];
const ESTADOS = ['Pendiente', 'En curso', 'Completado'];

const proyectoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    cliente: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    servicio: { type: String, required: true, enum: SERVICIOS },
    presupuesto: { type: Number, required: true, min: 0 }, // en pesos mexicanos (MXN)
    estado: { type: String, enum: ESTADOS, default: 'Pendiente' },
    fechaEntrega: { type: Date },
    descripcion: { type: String, trim: true, maxlength: 300 },
    propietario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

// Índices para los filtros, el orden y la paginación del listado
proyectoSchema.index({ propietario: 1, createdAt: -1 });
proyectoSchema.index({ estado: 1, createdAt: -1 });
proyectoSchema.index({ servicio: 1, createdAt: -1 });

module.exports = mongoose.model('Proyecto', proyectoSchema);
module.exports.SERVICIOS = SERVICIOS;
module.exports.ESTADOS = ESTADOS;

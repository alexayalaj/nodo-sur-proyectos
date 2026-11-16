const mongoose = require('mongoose');

const ROLES = ['usuario', 'admin'];

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select:false evita que el hash viaje en las consultas por defecto
    password: { type: String, required: true, select: false },
    // El rol nunca se recibe del cliente: todo registro nace como 'usuario'
    rol: { type: String, enum: ROLES, default: 'usuario' },
    // Un usuario desactivado no puede usar la API aunque su token siga vigente
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', usuarioSchema);
module.exports.ROLES = ROLES;

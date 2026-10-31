const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    correo: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // select:false evita que el hash viaje en las consultas por defecto
    password: { type: String, required: true, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Usuario', usuarioSchema);

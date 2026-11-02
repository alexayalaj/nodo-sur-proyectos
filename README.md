# Proyectos Nodo Sur

Avance del reto final de Desarrollo Full-Stack (Universidad Tecmilenio). Aplicación para que
Nodo Sur Soluciones Digitales S.A. de C.V. gestione sus proyectos de servicios de TI: API REST con
Node.js, Express, MongoDB (Mongoose) y autenticación JWT, más un frontend en HTML, CSS y JavaScript.

Alumno: Alexis Ayala.

## Reglas de acceso

- Consultar proyectos es público.
- Crear un proyecto exige iniciar sesión.
- Editar y eliminar solo puede hacerlo el propietario del proyecto.

## Estructura

```
backend/
  server.js        arranque: carga .env, conecta a MongoDB y escucha
  app.js           aplicación Express (CORS, JSON, estáticos, rutas, 404 y errores)
  config/db.js     conexión con Mongoose
  models/          Usuario y Proyecto
  controllers/     lógica de autenticación y CRUD de proyectos
  routes/          rutas de /api/auth y /api/proyectos
  middleware/      autenticar (JWT), validar (400) y errores (404 y manejador final)
  scripts/         seed.js (datos de ejemplo) y db-local.js (MongoDB local)
  tests/           pruebas con node:test y mongodb-memory-server
frontend/          index.html (acceso), proyectos.html (principal), css/, js/, images/
docs/              colección de Postman
render.yaml        configuración del despliegue en Render
```

## Ejecución local

Requisitos: Node.js 20 o superior.

1. `npm install`
2. Copia `.env.example` como `.env` y completa `JWT_SECRET` (cadena larga y aleatoria).
   Para la base local usa `MONGODB_URI=mongodb://127.0.0.1:27017/nodo_sur_proyectos`.
3. En una terminal: `npm run db:local` (levanta un MongoDB real; los datos quedan en `.mongo-data/`).
4. En otra terminal: `npm run dev` (o `npm start`) y abre http://localhost:3000.
5. Opcional: define `SEED_PASSWORD` en `.env` y ejecuta `npm run seed` para cargar datos de ejemplo.
6. Pruebas: `npm test` (no necesita la base local; usa su propia instancia temporal).

## Variables de entorno

| Variable | Uso |
|---|---|
| PORT | Puerto del servidor (en Render lo asigna la plataforma) |
| MONGODB_URI | Cadena de conexión de MongoDB (local o Atlas) |
| JWT_SECRET | Clave para firmar tokens; obligatoria |
| JWT_EXPIRES_IN | Vigencia del token (por defecto 30m) |
| CORS_ORIGIN | Origen permitido; `*` solo para pruebas |
| SEED_PASSWORD | Contraseña de los usuarios de ejemplo (solo `npm run seed`) |

## Endpoints

Todas las respuestas tienen la forma `{ ok, data, message }`.

| Método y ruta | Acceso | Éxito | Errores |
|---|---|---|---|
| GET `/api/salud` | público | 200 | |
| POST `/api/auth/registro` | público | 201 | 400, 409 |
| POST `/api/auth/login` | público | 200 | 400, 401 |
| GET `/api/auth/perfil` | token | 200 | 401, 403 |
| GET `/api/proyectos` | público | 200 | |
| GET `/api/proyectos/:id` | público | 200 | 400, 404 |
| POST `/api/proyectos` | token | 201 | 400, 401, 403 |
| PUT `/api/proyectos/:id` | token y propietario | 200 | 400, 401, 403, 404 |
| DELETE `/api/proyectos/:id` | token y propietario | 200 | 400, 401, 403, 404 |

El token se envía en el encabezado `Authorization: Bearer <token>`. Importa
`docs/NodoSur_Proyectos.postman_collection.json` en Postman para probar todas las rutas.

## Enlaces

- Repositorio: https://github.com/alexayalaj/nodo-sur-proyectos
- Despliegue en la nube (Render + MongoDB Atlas): https://nodo-sur-proyectos.onrender.com

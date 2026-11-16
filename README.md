# Proyectos Nodo Sur

Entrega final del reto de Desarrollo Full-Stack (Universidad Tecmilenio). Aplicación para que
Nodo Sur Soluciones Digitales S.A. de C.V. gestione sus proyectos de servicios de TI: API REST con
Node.js, Express, MongoDB (Mongoose) y autenticación JWT con roles, más un frontend en React con
Vite y React Router. Amplía el Avance del reto (etiqueta `v1.0-avance`).

Alumno: Alexis Ayala.

## Qué incluye

- CRUD de proyectos con filtros (estado, servicio, búsqueda), orden y paginación.
- Autenticación con JWT y dos roles: `usuario` y `admin`.
- Administración de usuarios (cambio de rol y activación o desactivación) solo para administradores.
- Integración con la API pública de tipo de cambio Frankfurter (conversión del presupuesto).
- Validación con express-validator, helmet, límite de intentos de acceso y registro de peticiones.
- Frontend React: rutas dinámicas, rutas protegidas por sesión y por rol, tablero, filtros en la URL.
- Pruebas con Jest y supertest, integración continua con GitHub Actions y despliegue en Render.

## Reglas de acceso

| Quién | Qué puede hacer |
|---|---|
| Sin sesión | Solo `/api/salud`, registro e inicio de sesión |
| Usuario | Ver, crear, editar y eliminar sus propios proyectos; usar el tipo de cambio |
| Administrador | Todo lo anterior sobre cualquier proyecto, filtrar por propietario y administrar usuarios |

El registro siempre crea usuarios con rol `usuario`. Para crear un administrador se usa el script
`npm run promover-admin` (ver más abajo).

## Estructura

```
backend/
  server.js        arranque: carga .env, conecta a MongoDB y escucha
  app.js           Express: helmet, CORS, JSON, logger, rutas, 404 de API, frontend y errores
  config/db.js     conexión con Mongoose (sanitizeFilter activo)
  models/          Usuario (rol, activo) y Proyecto (con índices)
  controllers/     auth, proyectos, usuarios y tipo de cambio
  services/        tipoCambio.js (cliente de Frankfurter con tiempo límite y caché)
  routes/          /api/auth, /api/proyectos, /api/usuarios y /api/tipo-cambio
  middleware/      autenticar, autorizar, validaciones, limites, logger y errores
  scripts/         seed.js, db-local.js y promover-admin.js
  tests/           unit/, funcional/ y seguridad/ (Jest + supertest + mongodb-memory-server)
frontend/          Vite + React + React Router (src/paginas, src/componentes, src/context, src/api)
docs/              colección de Postman
render.yaml        configuración del despliegue en Render
.github/workflows  integración continua
```

## Ejecución local

Requisitos: Node.js 20 o superior.

1. `npm install`
2. Copia `.env.example` como `.env` y completa `JWT_SECRET` (cadena larga y aleatoria).
   Para la base local usa `MONGODB_URI=mongodb://127.0.0.1:27017/nodo_sur_proyectos`.
3. `npm run build` instala las dependencias del frontend y lo compila en `frontend/dist`.
4. En una terminal: `npm run db:local` (levanta un MongoDB real; los datos quedan en `.mongo-data/`).
5. Opcional: define `SEED_PASSWORD` en `.env` y ejecuta `npm run seed`
   (crea `ana@nodosur.example` como administradora, `luis@nodosur.example` como usuario y 25 proyectos).
6. En otra terminal: `npm start` y abre http://localhost:3000.

Desarrollo del frontend con recarga en caliente: deja `npm run dev` (backend, puerto 3000) y en otra
terminal `npm run dev --prefix frontend` (Vite, puerto 5173, que reenvía `/api` al backend).

Depuración: `npm run debug` inicia el servidor con `--inspect`; en Chrome abre `chrome://inspect`.

Promover a un administrador (usa el `MONGODB_URI` del `.env`, local o Atlas):
`npm run promover-admin -- correo@ejemplo.com`

## Variables de entorno

| Variable | Uso |
|---|---|
| PORT | Puerto del servidor (en Render lo asigna la plataforma) |
| MONGODB_URI | Cadena de conexión de MongoDB (local o Atlas) |
| JWT_SECRET | Clave para firmar tokens; obligatoria |
| JWT_EXPIRES_IN | Vigencia del token (por defecto 30m) |
| CORS_ORIGIN | Origen permitido; `*` solo para pruebas |
| SEED_PASSWORD | Contraseña de los usuarios de ejemplo (solo `npm run seed`) |
| FRANKFURTER_URL | Opcional: URL base de la API de tipo de cambio (por defecto la pública) |
| LIMITE_INTENTOS | Opcional: intentos de login o registro por IP cada 15 minutos (por defecto 10) |

## Endpoints

Todas las respuestas tienen la forma `{ ok, data, message }`; los listados agregan `meta`
(`pagina`, `limite`, `total`, `totalPaginas`) y los errores de validación agregan `errores` por campo.

| Método y ruta | Acceso | Éxito | Errores |
|---|---|---|---|
| GET `/api/salud` | público | 200 | |
| POST `/api/auth/registro` | público, con límite | 201 | 400, 409, 429 |
| POST `/api/auth/login` | público, con límite | 200 | 400, 401, 403, 429 |
| GET `/api/auth/perfil` | token | 200 | 401, 403 |
| GET `/api/proyectos?pagina&limite&estado&servicio&q&orden&propietario` | token (propietario solo admin) | 200 | 400, 401, 403 |
| GET `/api/proyectos/resumen` | token | 200 | 401, 403 |
| GET `/api/proyectos/:id` | token, propietario o admin | 200 | 400, 401, 403, 404 |
| POST `/api/proyectos` | token | 201 | 400, 401, 403 |
| PUT `/api/proyectos/:id` | token, propietario o admin | 200 | 400, 401, 403, 404 |
| DELETE `/api/proyectos/:id` | token, propietario o admin | 200 | 400, 401, 403, 404 |
| GET `/api/usuarios?pagina&limite` | admin | 200 | 400, 401, 403 |
| PATCH `/api/usuarios/:id/rol` | admin | 200 | 400, 401, 403, 404 |
| PATCH `/api/usuarios/:id/estado` | admin | 200 | 400, 401, 403, 404 |
| GET `/api/tipo-cambio?monedas=USD,EUR` | token | 200 | 400, 401, 403, 502, 504 |

El token se envía en el encabezado `Authorization: Bearer <token>`. Importa
`docs/NodoSur_Proyectos.postman_collection.json` en Postman (variables `baseUrl`, `token`,
`tokenAdmin` y `password`) para probar todas las rutas.

## Pruebas

- `npm test` ejecuta las pruebas con Jest y supertest. Usan una base MongoDB temporal en memoria
  y simulan la API de tipo de cambio, por lo que no necesitan red ni la base local.
- `npm run test:cobertura` agrega el reporte de cobertura (carpeta `coverage/`).
- Cada prueba lleva un identificador (por ejemplo `TC-AUTH-01`, `TC-PRO-03`, `TC-SEG-12`).

## Despliegue

El servicio de Render ejecuta `npm install && npm run build` y luego `npm start`; Express sirve el
frontend compilado y devuelve `index.html` en las rutas que no son `/api`. La base de datos es
MongoDB Atlas. Variables obligatorias en Render: `MONGODB_URI`, `JWT_SECRET`.

## Enlaces

- Repositorio: https://github.com/alexayalaj/nodo-sur-proyectos
- Despliegue en la nube (Render + MongoDB Atlas): https://nodo-sur-proyectos.onrender.com

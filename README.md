# ShipNow — API Backend (Pre-entrega Módulo 2)

API REST de **ShipNow**, refactorizada a una arquitectura profesional por capas (**Router → Controller → Service → Repository → Model**) con configuración de entorno validada al arranque y un diccionario de constantes para roles y estados.

Entidades: **Products**, **Users**, **Orders** y **Deliveries**.

## Tecnologías

- Node.js + Express
- MongoDB + Mongoose
- Passport.js (`passport-local` para register/login, `passport-jwt` para la sesión)
- JWT en cookie `httpOnly`, bcrypt, dotenv, cookie-parser

## Cómo correr el proyecto localmente

Requisitos: Node.js 18+ y una instancia de MongoDB corriendo (local o Atlas).

```bash
git clone <url-del-repositorio>
cd shipnow
npm install
cp .env.example .env     # completá los valores (sobre todo JWT_SECRET)
npm run seed             # opcional: crea usuarios y productos de prueba
npm run dev              # servidor con reinicio automático
```

El servidor queda en `http://localhost:8080` (o el `PORT` que configures). `GET /api/health` confirma que está arriba.

Otros comandos: `npm start` (modo normal), `npm run seed` (datos de prueba).

## Variables de entorno

El archivo `.env` **no se sube al repo** (está en `.gitignore`). `.env.example` documenta las claves necesarias.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | Sí | Puerto del servidor (ej: `8080`) |
| `NODE_ENV` | Sí | `development`, `production` o `test` |
| `MONGODB_URI` | Sí | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Sí | Secreto para firmar el JWT |
| `JWT_EXPIRES_IN` | No | Expiración del JWT (por defecto `1h`) |

### Configuración validada al arranque

`src/config/env.config.js` es el **único archivo que lee `process.env`**. Carga `dotenv`, valida las variables y exporta un objeto `config` congelado que usa el resto de la app (`import { config } from "./config/index.js"`).

Si falta una variable obligatoria, la app **no arranca** y muestra un error descriptivo:

```
Error: Faltan variables de entorno obligatorias: MONGODB_URI. Revisá tu archivo .env (podés copiar .env.example).
```

También valida que `PORT` sea un entero positivo y que `NODE_ENV` tenga un valor permitido.

### Constantes del dominio

`src/constants/index.js` define con `Object.freeze` los valores fijos del negocio, sin strings sueltos por el código:

```js
USER_ROLES        // ADMIN, USER (cliente), DRIVER (repartidor)
PRODUCT_STATUS    // AVAILABLE, OUT_OF_STOCK
ORDER_STATUS      // CREATED, ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED, CANCELLED
DELIVERY_STATUS   // ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED
DELIVERY_PRIORITY // LOW, NORMAL, HIGH, URGENT
MOCK_LIMITS       // DEFAULT_QTY (10), MAX_QTY (100)
NODE_ENVIRONMENTS // DEVELOPMENT, PRODUCTION, TEST
```

Uso: `authorize([USER_ROLES.ADMIN])`, `status: PRODUCT_STATUS.AVAILABLE`. (`src/utils/constants.js` re-exporta el mismo archivo.)

## Arquitectura en capas

```
Request → Router → Controller → Service → Repository → Modelo (Mongoose) → MongoDB
                       ↑
                     DTO (da forma a la respuesta, nunca expone password)
```

- **Router** (`src/routes`): solo conecta el path (y sus middlewares de acceso) con el método del controller.
- **Controller** (`src/controllers`): único punto de entrada HTTP. Lee `req`, llama al service, arma la respuesta y devuelve el status code. **Nunca importa Mongoose, modelos ni repositories.**
- **Service** (`src/services`): lógica de negocio y validaciones. Solo conoce repositories; nunca Mongoose ni `req`/`res`.
- **Repository** (`src/repositories`): **único lugar que conoce Mongoose/MongoDB.**
- **Model** (`src/models`): solo define el esquema.
- **DTO** (`src/dto`): controla qué campos viajan en la respuesta.
- **Middlewares** (`src/middlewares`): `auth` (401), `authorize` (403), `passport` y `error` (traduce errores de negocio a status HTTP).

## Por qué separé la lógica entre Service y Repository

**Repository = cómo se guardan y se buscan los datos.** Es el único archivo que importa los modelos y decide cosas de acceso, no de negocio:
- Qué campos se devuelven: por defecto nunca viene `password` ni `__v`. Solo el login pide el hash, con un método aparte (`findUserByEmailWithPassword`).
- Orden por defecto de los productos (más nuevos primero), `.lean()` y proyecciones.
- Qué pasa con un id mal formado (`/api/products/abc`): devuelve `null` en vez de dejar explotar a Mongoose con un `CastError`.

**Service = qué reglas del negocio se aplican.** No sabe si los datos están en MongoDB, en otra base o en memoria. Por eso acá vive:
- El **estado del producto según su stock**: `stock > 0` → `AVAILABLE`, `stock = 0` → `OUT_OF_STOCK`. Se recalcula solo al crear o editar; nadie lo manda a mano.
- El **filtro por defecto del listado**: solo se muestran productos disponibles (con stock); los agotados se piden con `?status=out_of_stock`.
- Las validaciones (precio, stock entero ≥ 0, nombre duplicado) y convertir "el repository devolvió `null`" en el error de negocio correcto (`PRODUCT_NOT_FOUND`, `USER_NOT_FOUND`).

Así, si cambia la base de datos solo se toca el repository, y si cambia una regla (por ejemplo, qué se considera "agotado") solo se toca el service.

## Modelos

**User**: `first_name`, `last_name`, `email` (único), `password` (hasheada), `role` (`user` | `admin`).

**Product**: `name` (único), `description`, `category`, `price`, `stock`, `status` (`available` | `out_of_stock`).

## Endpoints

### Sesiones

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/sessions/register` | Público | Registrar usuario (rol siempre `user`) |
| POST | `/api/sessions/login` | Público | Login, setea cookie JWT |
| GET | `/api/sessions/current` | Autenticado | Usuario actual |
| POST | `/api/sessions/logout` | Público | Cierra sesión |

### Productos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/products` | Público | Listado (solo disponibles por defecto). Filtros: `status`, `category`. Paginación: `page`, `limit`. Orden: `sort` (ej. `-price`) |
| GET | `/api/products/:id` | Público | Detalle de un producto |
| POST | `/api/products` | admin | Crear producto |
| PUT | `/api/products/:id` | admin | Editar producto (el `status` se recalcula según el `stock`) |
| DELETE | `/api/products/:id` | admin | Eliminar producto |

### Usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/users` | admin | Listado de usuarios (sin `password`) |
| GET | `/api/users/:id` | admin | Detalle de un usuario |

## Usuarios y productos de prueba

`npm run seed` crea (si no existen):

| Email | Contraseña | Rol |
|---|---|---|
| `admin@shipnow.com` | `admin1234` | admin |
| `user@shipnow.com` | `user1234` | user |

Y tres productos de ejemplo (uno de ellos sin stock). El registro público siempre crea usuarios con rol `user`, por seguridad.

## Ejemplo de uso

```bash
# login como admin (guarda la cookie)
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@shipnow.com","password":"admin1234"}' -c cookies.txt

# crear un producto
curl -X POST http://localhost:8080/api/products -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"name":"Bolsa courier","description":"Bolsa para envíos","category":"embalaje","price":150,"stock":200}'

# listar productos disponibles, más caros primero
curl "http://localhost:8080/api/products?sort=-price&limit=5"
```

## Manejo de errores

El middleware `error.middleware.js` traduce errores de negocio (`ServiceError` con un `code`) a su status HTTP. Cualquier error no controlado responde `500` genérico, sin filtrar detalles internos.

| Código HTTP | Cuándo |
|---|---|
| 400 | Datos inválidos (campos faltantes, precio o stock inválido, estado inválido) |
| 401 | No autenticado |
| 403 | Autenticado pero sin permisos |
| 404 | Producto o usuario inexistente |
| 409 | Conflicto (email ya registrado, nombre de producto repetido) |
| 500 | Error interno no controlado |

## Mocking y carga de datos de prueba (Módulo 2)

Router `/api/mocks`, pensado solo para desarrollo: **no se monta si `NODE_ENV=production`** (responde 404). Usa `@faker-js/faker` en español y respeta la arquitectura por capas:

```
mocks.router → mocks.controller → mocks.service → repositories (users / orders / deliveries)
                                       ↓
                                  src/mocks/ (generadores puros, no tocan la base)
```

### Qué datos se generan

- **Usuarios**: `first_name`, `last_name`, `email` (`@test.com`), `role` (`USER` o `DRIVER`). Los repartidores llevan `isAvailable`. La contraseña de todos los usuarios insertados es `coder123` (guardada hasheada con bcrypt).
- **Pedidos**: `customer` (usuario real), `items` (nombre, cantidad, precio), `deliveryAddress`, `total` (suma de los items), `status` (`ORDER_STATUS`) y `priority` (`DELIVERY_PRIORITY`).
- **Entregas**: `order` (pedido real), `driver` (usuario con rol `DRIVER`), `status` (el que corresponde al estado del pedido) y `priority` (la del pedido). Solo los pedidos asignados, retirados, en tránsito o entregados tienen entrega; uno `CREATED` o `CANCELLED` no.

### Endpoints que NO guardan en la base

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Usuarios falsos (mezcla de clientes y repartidores). Opcional: `&role=driver` o `&role=user`. Alias: `/mockingusers` |
| GET | `/api/mocks/orders?qty=3` | Pedidos falsos con ids de cliente inventados. Alias: `/mockingorders` |
| GET | `/api/mocks/deliveries?qty=3` | Entregas falsas, cada una asociada a un pedido y a un repartidor inventados |

`qty` es opcional (por defecto 10, máximo 100).

### Endpoints que SÍ insertan en MongoDB

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/mocks/seed?qty=10` | Inserta 10 usuarios (clientes y repartidores). Responde `{ "insertados": 10, "coleccion": "users" }` |
| POST | `/api/mocks/generateData` | Inserta usuarios, repartidores, pedidos y entregas relacionados entre sí |

Body de `generateData` (todos opcionales, enteros de 0 a 100, al menos uno mayor a 0):

```json
{ "users": 5, "drivers": 3, "orders": 20, "deliveries": 8 }
```

Respuesta `201`:

```json
{ "status": "success", "insertados": { "users": 5, "drivers": 3, "orders": 20, "deliveries": 8 } }
```

Reglas: se crean en orden (usuarios → pedidos → entregas) para que las relaciones sean reales. Los pedidos usan los clientes recién creados o, si no se pidió ninguno, los que ya existan en la base. Las entregas usan repartidores nuevos o existentes. No puede haber más entregas que pedidos. Si no hay clientes o repartidores disponibles, responde `400` con un mensaje claro.

### Cómo probarlo

```bash
npm run dev
# ver datos falsos (no guarda nada)
curl "http://localhost:8080/api/mocks/users?qty=2"
# cargar datos de prueba
curl -X POST http://localhost:8080/api/mocks/generateData \
  -H "Content-Type: application/json" \
  -d '{"users":5,"drivers":3,"orders":20,"deliveries":8}'
```

Después se pueden ver las colecciones `users`, `orders` y `deliveries` en MongoDB Atlas o Compass.

## Estructura del proyecto

```
src/
├── app.js                    # configuración de Express y montaje de routers
├── server.js                 # conecta a la DB y arranca el servidor
├── config/
│   ├── env.config.js         # dotenv + validación (único lugar con process.env)
│   ├── index.js              # exporta el objeto config
│   ├── db.config.js          # abre/cierra la conexión a MongoDB
│   └── passport.config.js    # estrategias register / login / current
├── constants/index.js        # USER_ROLES, PRODUCT_STATUS, NODE_ENVIRONMENTS (Object.freeze)
├── models/                   # User, Product, Order, Delivery (solo esquemas)
├── mocks/                    # generadores de datos falsos (users, orders, deliveries)
├── repositories/             # único lugar que habla con Mongoose
├── services/                 # lógica de negocio
├── controllers/              # solo HTTP: req → service → res
├── dto/                      # forma de las respuestas
├── routes/                   # solo conectan path con controller
├── middlewares/              # auth, authorize, passport, error
└── utils/                    # hash, jwt, validators, service-error, constants, seed
```

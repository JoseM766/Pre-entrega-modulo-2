# ShipNow — Pre-entrega Módulo 2: Mocking y carga de datos de prueba

Módulo de mocking para ShipNow API que genera usuarios, repartidores, pedidos y entregas simulados, sin depender de datos cargados a mano. Vive bajo el router `/api/mocks` y respeta la arquitectura por capas.

## Cómo correr el proyecto

```bash
npm install
cp .env.example .env     # completar MONGODB_URI y JWT_SECRET
npm run dev
```

El servidor queda en `http://localhost:8080`.

## Arquitectura del módulo

Es una herramienta de desarrollo: **el router no se monta si `NODE_ENV=production`** (responde 404). Usa `@faker-js/faker` en español.

```
mocks.router → mocks.controller → mocks.service → repositories (users / orders / deliveries)
                                       ↓
                                  src/mocks/ (generadores puros, no tocan la base)
```

## Qué datos se generan

- **Usuarios**: `first_name`, `last_name`, `email` (`@test.com`), `role` (`USER` o `DRIVER`). Los repartidores llevan `isAvailable`. La contraseña de todos los usuarios insertados es `coder123` (guardada hasheada con bcrypt).
- **Pedidos**: `customer` (usuario real), `items` (nombre, cantidad, precio), `deliveryAddress`, `total` (suma de los items), `status` (`ORDER_STATUS`) y `priority` (`DELIVERY_PRIORITY`).
- **Entregas**: `order` (pedido real), `driver` (usuario con rol `DRIVER`), `status` (el que corresponde al estado del pedido) y `priority` (la del pedido). Solo los pedidos asignados, retirados, en tránsito o entregados tienen entrega; uno `CREATED` o `CANCELLED` no.

## Endpoints que NO guardan en la base

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/mocks/users?qty=2` | Usuarios falsos (mezcla de clientes y repartidores). Opcional: `&role=driver` o `&role=user`. Alias: `/mockingusers` |
| GET | `/api/mocks/orders?qty=3` | Pedidos falsos con ids de cliente inventados. Alias: `/mockingorders` |
| GET | `/api/mocks/deliveries?qty=3` | Entregas falsas, cada una asociada a un pedido y a un repartidor inventados |

`qty` es opcional (por defecto 10, máximo 100).

## Endpoints que SÍ insertan en MongoDB

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

## Cómo probarlo

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

## Constantes utilizadas

Los roles, estados y prioridades salen de `src/constants/index.js`, sin strings sueltos: `USER_ROLES` (`USER`, `DRIVER`), `ORDER_STATUS`, `DELIVERY_STATUS`, `DELIVERY_PRIORITY` y `MOCK_LIMITS` (cantidad por defecto 10, máximo 100).

## Validaciones

Las cantidades (`qty`, `users`, `drivers`, `orders`, `deliveries`) deben ser enteros entre 0 y 100. Si no se cumple, o si todas están en 0, o si hay más entregas que pedidos, o si faltan clientes/repartidores para relacionar, la API responde `400` con un mensaje claro.

## Archivos de esta entrega

```
src/
├── routes/mocks.router.js
├── controllers/mocks.controller.js
├── services/mocks.service.js
├── mocks/                     # generadores de datos falsos (users, orders, deliveries)
├── repositories/              # users, orders, deliveries (insertMany)
└── models/                    # User, Order, Delivery
```

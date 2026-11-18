import * as usersRepository from "../repositories/users.repository.js";
import * as ordersRepository from "../repositories/orders.repository.js";
import * as deliveriesRepository from "../repositories/deliveries.repository.js";
import { USER_ROLES, MOCK_LIMITS, MOCK_PASSWORD } from "../constants/index.js";
import { ServiceError } from "../utils/service-error.js";
import { hashPassword } from "../utils/hash.js";
import { generateMockUsers, MOCK_USER_ROLES } from "../mocks/users.mock.js";
import { generateMockOrders } from "../mocks/orders.mock.js";
import {
  generateMockDeliveries,
  DELIVERABLE_ORDER_STATUSES,
} from "../mocks/deliveries.mock.js";
import { fakeObjectId, times } from "../mocks/helpers.mock.js";

// --- Validaciones ---
const parseQty = (value, { defaultValue = MOCK_LIMITS.DEFAULT_QTY } = {}) => {
  if (value === undefined || value === "") return defaultValue;

  const qty = Number(value);
  if (!Number.isInteger(qty) || qty < 0 || qty > MOCK_LIMITS.MAX_QTY) {
    throw new ServiceError(
      "INVALID_QTY",
      `La cantidad debe ser un entero entre 0 y ${MOCK_LIMITS.MAX_QTY}`
    );
  }
  return qty;
};

const parseRole = (role) => {
  if (role === undefined) return undefined;
  if (!MOCK_USER_ROLES.includes(role)) {
    throw new ServiceError("INVALID_ROLE", `El rol debe ser uno de: ${MOCK_USER_ROLES.join(", ")}`);
  }
  return role;
};

const hashedMockPassword = () => hashPassword(MOCK_PASSWORD);

// --- Datos simulados que NO se guardan ---
export const getMockUsers = ({ qty, role }) => {
  return generateMockUsers(parseQty(qty), parseRole(role));
};

export const getMockOrders = ({ qty }) => {
  const fakeCustomerIds = times(3, fakeObjectId);
  return generateMockOrders(parseQty(qty), fakeCustomerIds);
};

export const getMockDeliveries = ({ qty }) => {
  const quantity = parseQty(qty);
  const fakeCustomerIds = times(3, fakeObjectId);
  const fakeDriverIds = times(3, fakeObjectId);

  // Pedidos falsos con id propio, para que cada entrega apunte a uno.
  const orders = generateMockOrders(quantity, fakeCustomerIds, DELIVERABLE_ORDER_STATUSES).map(
    (order) => ({ ...order, _id: fakeObjectId() })
  );

  return generateMockDeliveries(orders, fakeDriverIds);
};

// --- Carga en MongoDB ---
const insertUsers = async (qty, role) => {
  if (qty === 0) return [];
  const password = await hashedMockPassword();
  const usersData = generateMockUsers(qty, role).map((user) => ({ ...user, password }));
  return usersRepository.insertManyUsers(usersData);
};

// POST /api/mocks/seed?qty=10 : inserta solo usuarios (clientes y repartidores).
export const seedUsers = async ({ qty, role }) => {
  const created = await insertUsers(parseQty(qty), parseRole(role));
  return { insertados: created.length, coleccion: "users" };
};

// POST /api/mocks/generateData : inserta usuarios, repartidores, pedidos y entregas relacionados.
export const generateData = async ({ users, drivers, orders, deliveries }) => {
  const usersQty = parseQty(users, { defaultValue: 0 });
  const driversQty = parseQty(drivers, { defaultValue: 0 });
  const ordersQty = parseQty(orders, { defaultValue: 0 });
  const deliveriesQty = parseQty(deliveries, { defaultValue: 0 });

  if (usersQty + driversQty + ordersQty + deliveriesQty === 0) {
    throw new ServiceError("INVALID_QTY", "Al menos una cantidad debe ser mayor a 0");
  }

  if (deliveriesQty > ordersQty) {
    throw new ServiceError("INVALID_QTY", "No puede haber más entregas que pedidos (cada entrega pertenece a un pedido)");
  }

  // 1) Usuarios y repartidores
  const createdCustomers = await insertUsers(usersQty, USER_ROLES.USER);
  const createdDrivers = await insertUsers(driversQty, USER_ROLES.DRIVER);

  // 2) Pedidos: usan los clientes recién creados o, si no hay, los que ya existen en la base
  let createdOrders = [];
  if (ordersQty > 0) {
    const customerPool = createdCustomers.length
      ? createdCustomers
      : await usersRepository.findUsersByRole(USER_ROLES.USER);

    if (customerPool.length === 0) {
      throw new ServiceError("NO_CUSTOMERS", "No hay clientes para asignar a los pedidos: pedí también users > 0");
    }

    const customerIds = customerPool.map((customer) => customer._id);

    // Los primeros "deliveriesQty" pedidos tienen un estado que admite entrega; el resto, cualquiera.
    const ordersData = [
      ...generateMockOrders(deliveriesQty, customerIds, DELIVERABLE_ORDER_STATUSES),
      ...generateMockOrders(ordersQty - deliveriesQty, customerIds),
    ];
    createdOrders = await ordersRepository.insertManyOrders(ordersData);
  }

  // 3) Entregas: cada una apunta a un pedido real y a un repartidor real
  let createdDeliveries = [];
  if (deliveriesQty > 0) {
    const driverPool = createdDrivers.length
      ? createdDrivers
      : await usersRepository.findUsersByRole(USER_ROLES.DRIVER);

    if (driverPool.length === 0) {
      throw new ServiceError("NO_DRIVERS", "No hay repartidores para asignar a las entregas: pedí también drivers > 0");
    }

    const driverIds = driverPool.map((driver) => driver._id);
    const deliverableOrders = createdOrders.slice(0, deliveriesQty);
    createdDeliveries = await deliveriesRepository.insertManyDeliveries(
      generateMockDeliveries(deliverableOrders, driverIds)
    );
  }

  return {
    users: createdCustomers.length,
    drivers: createdDrivers.length,
    orders: createdOrders.length,
    deliveries: createdDeliveries.length,
  };
};

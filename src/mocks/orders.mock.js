import { fakerES as faker } from "@faker-js/faker";
import { ORDER_STATUS, DELIVERY_PRIORITY } from "../constants/index.js";
import { pickRandom, times } from "./helpers.mock.js";

const ALL_STATUSES = Object.values(ORDER_STATUS);
const ALL_PRIORITIES = Object.values(DELIVERY_PRIORITY);

const generateItem = () => ({
  name: faker.commerce.productName(),
  quantity: faker.number.int({ min: 1, max: 5 }),
  price: faker.number.int({ min: 500, max: 5000 }),
});

// customerId: id de un usuario (real al insertar, falso al solo mostrar).
export const generateMockOrder = (customerId, statuses = ALL_STATUSES) => {
  const items = times(faker.number.int({ min: 1, max: 3 }), generateItem);
  const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

  return {
    customer: customerId,
    items,
    deliveryAddress: faker.location.streetAddress(),
    total,
    status: pickRandom(statuses),
    priority: pickRandom(ALL_PRIORITIES),
  };
};

// Cada pedido toma un cliente al azar de customerIds.
export const generateMockOrders = (qty, customerIds, statuses) =>
  times(qty, () => generateMockOrder(pickRandom(customerIds), statuses));

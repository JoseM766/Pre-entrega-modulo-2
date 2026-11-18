import { ORDER_TO_DELIVERY_STATUS } from "../constants/index.js";
import { pickRandom } from "./helpers.mock.js";

// Estados de pedido que tienen entrega (ASSIGNED, PICKED_UP, IN_TRANSIT, DELIVERED).
export const DELIVERABLE_ORDER_STATUSES = Object.keys(ORDER_TO_DELIVERY_STATUS);

// Una entrega por pedido: mismo estado y prioridad que el pedido, y con repartidor asignado.
export const generateMockDeliveries = (orders, driverIds) =>
  orders.map((order) => ({
    order: order._id,
    driver: pickRandom(driverIds),
    status: ORDER_TO_DELIVERY_STATUS[order.status],
    priority: order.priority,
  }));

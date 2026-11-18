// Valores inmutables del dominio. Object.freeze evita que se modifiquen en runtime
// y centraliza los "strings mágicos" en un único lugar.

export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  USER: "user", // cliente
  DRIVER: "driver", // repartidor
});

export const PRODUCT_STATUS = Object.freeze({
  AVAILABLE: "available",
  OUT_OF_STOCK: "out_of_stock",
});

export const NODE_ENVIRONMENTS = Object.freeze({
  DEVELOPMENT: "development",
  PRODUCTION: "production",
  TEST: "test",
});

export const ORDER_STATUS = Object.freeze({
  CREATED: "created",
  ASSIGNED: "assigned",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
});

export const DELIVERY_STATUS = Object.freeze({
  ASSIGNED: "assigned",
  PICKED_UP: "picked_up",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
});

export const DELIVERY_PRIORITY = Object.freeze({
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
  URGENT: "urgent",
});

// Estado de la entrega que corresponde a cada estado del pedido.
// Un pedido CREATED o CANCELLED no tiene entrega.
export const ORDER_TO_DELIVERY_STATUS = Object.freeze({
  [ORDER_STATUS.ASSIGNED]: DELIVERY_STATUS.ASSIGNED,
  [ORDER_STATUS.PICKED_UP]: DELIVERY_STATUS.PICKED_UP,
  [ORDER_STATUS.IN_TRANSIT]: DELIVERY_STATUS.IN_TRANSIT,
  [ORDER_STATUS.DELIVERED]: DELIVERY_STATUS.DELIVERED,
});

export const MOCK_LIMITS = Object.freeze({
  DEFAULT_QTY: 10,
  MAX_QTY: 100,
});

export const MOCK_PASSWORD = "coder123";

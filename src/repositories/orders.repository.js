import Order from "../models/Order.js";

// Único archivo que conoce el modelo Order.
export const insertManyOrders = async (ordersData) => {
  const docs = await Order.insertMany(ordersData);
  return docs.map((doc) => doc.toObject({ versionKey: false }));
};

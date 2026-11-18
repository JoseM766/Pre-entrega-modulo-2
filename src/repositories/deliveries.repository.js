import Delivery from "../models/Delivery.js";

// Único archivo que conoce el modelo Delivery.
export const insertManyDeliveries = async (deliveriesData) => {
  const docs = await Delivery.insertMany(deliveriesData);
  return docs.map((doc) => doc.toObject({ versionKey: false }));
};

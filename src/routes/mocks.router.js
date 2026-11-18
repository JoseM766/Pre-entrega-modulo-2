import { Router } from "express";
import {
  getMockUsers,
  getMockOrders,
  getMockDeliveries,
  seedUsers,
  generateData,
} from "../controllers/mocks.controller.js";

const router = Router();

// Devuelven datos simulados, NO tocan la base
router.get(["/users", "/mockingusers"], getMockUsers);
router.get(["/orders", "/mockingorders"], getMockOrders);
router.get("/deliveries", getMockDeliveries);

// Insertan en MongoDB
router.post("/seed", seedUsers);
router.post("/generateData", generateData);

export default router;

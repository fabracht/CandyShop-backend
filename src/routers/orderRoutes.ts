import { Router } from "express";
import { protect } from "../controllers/authController";
import { createOrder, getOrders } from "../controllers/orderController";

export const router = Router();

router
  .route("/checkout/:id")
  .get(protect, getOrders)
  .post(protect, createOrder);

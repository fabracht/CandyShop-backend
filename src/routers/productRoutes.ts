import { Router } from "express";
import {
  getAllProducts,
  getOneProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

export const router = Router();

router
  .route("/product/:id")
  .get(getOneProduct)
  .patch(updateProduct)
  .delete(deleteProduct);
router.route("/product").get(getAllProducts).post(createProduct);

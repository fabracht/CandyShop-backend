import {
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { signup, login, protect } from "../controllers/authController";
import { Router } from "express";

export const router = Router();
router.route("/").get(getAllUsers);
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/user").get(protect, getAllUsers);
router
  .route("/user/:id")
  .get(protect, getOneUser)
  .patch(protect, updateUser)
  .post(protect, createUser)
  .delete(protect, deleteUser);

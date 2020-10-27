import {
  getAllUsers,
  getOneUser,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController";
import { Router } from "express";

export const router = Router();
router.route("/signup").post(signup);
router.route("/login").post(login);
router.route("/logout").get(protect, logout);
router.route("/isloggedin").post(protect);
router.route("/forgotPassword").post(forgotPassword);
router.route("/resetPassword/:token").patch(resetPassword);
router
  .route("/user/:id")
  .get(protect, getOneUser)
  .patch(protect, updateUser)
  .post(protect, createUser)
  .delete(protect, deleteUser);
router.route("/user").get(protect, getAllUsers);

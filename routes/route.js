import { Router } from "express";
import {
  signup,
  login,
  logout,
  updatePassword,
  deleteUser,
  protect
} from "./../controller/user.control.js";


export const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout)
router.patch("/updatePassword", protect, updatePassword)
router.delete("/delete", protect, deleteUser);

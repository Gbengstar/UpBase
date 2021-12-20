import { uploader } from "./../middleware/multer.js";
import { Router } from "express";
import { protect, upload, getUser } from "./../controller/user.control.js";

const router = Router();

router.post("/upload", protect, uploader, upload);
router.get("/user", protect, getUser)

export default router

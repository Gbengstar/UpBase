import multer from "multer";
import AppError  from "../utils/appError.js";

const multerStroage = multer.memoryStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/users");
  },
  filename: (req, file, cb) => {
    const extension = file.minetype.split("/")[1];
    cb(null, `user-${req.body.id}-${Date.now()}.${extension}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError('upload a vaile image file', 404), false);
  }
};

const upload = multer({
  storage: multerStroage,
  fileFilter: multerFilter,
});

export const uploader = upload.single("image");

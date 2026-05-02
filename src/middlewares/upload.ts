import multer from "multer";
import { Request } from "express";
import { validateImageFormat } from "../services/imageService";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void => {
  const validation = validateImageFormat(file.mimetype);
  if (validation.isValid) {
    cb(null, true);
  } else {
    cb(new Error(validation.error));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

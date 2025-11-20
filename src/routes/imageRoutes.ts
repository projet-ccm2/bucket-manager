import { Router } from "express";
import { insertImage, getImage } from "../controllers/imageController";
import {
  validateInsertImage,
  validateGetImage,
  handleValidationErrors,
} from "../middlewares/validation";
import { upload } from "../middlewares/upload";

const router = Router();

router.post(
  "/insert",
  upload.single("image"),
  validateInsertImage,
  handleValidationErrors,
  insertImage,
);

router.get(
  "/get",
  validateGetImage,
  handleValidationErrors,
  getImage,
);

export default router;


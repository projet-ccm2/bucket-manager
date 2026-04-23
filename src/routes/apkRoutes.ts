import { Router } from "express";
import { getApk } from "../controllers/apkController";

const router = Router();

router.get("/", getApk);

export default router;

import { Request, Response, NextFunction } from "express";
import { getApkUrl } from "../services/bucketService";
import { logger } from "../utils/logger";

export async function getApk(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    logger.info("Retrieving APK URL");
    const url = await getApkUrl();
    res.status(200).json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

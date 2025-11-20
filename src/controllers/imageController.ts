import { Request, Response, NextFunction } from "express";
import { processImage } from "../services/imageService";
import { uploadImage, getImageUrl } from "../services/bucketService";
import { logger } from "../utils/logger";

export async function insertImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const file = req.file;
    const { typeImage, userId } = req.body;

    if (!file) {
      res.status(400).json({
        error: "Aucune image fournie",
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info("Traitement de l'image", {
      typeImage,
      userId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const processedImage = await processImage(file.buffer);
    const key = await uploadImage(processedImage.buffer, typeImage, userId);

    res.status(200).json({
      success: true,
      key,
      message: "Image uploadée avec succès",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

export async function getImage(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { typeImage, userId } = req.query;

    logger.info("Récupération de l'URL de l'image", {
      typeImage,
      userId,
    });

    const url = await getImageUrl(typeImage as string, userId as string);

    res.status(200).json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}


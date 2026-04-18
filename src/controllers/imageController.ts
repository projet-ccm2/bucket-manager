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
    const { typeImage, elementId } = req.body;

    if (!file) {
      res.status(400).json({
        error: "No image provided",
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logger.info("Processing image", {
      typeImage,
      elementId,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    const processedImage = await processImage(file.buffer);
    await uploadImage(processedImage.buffer, typeImage, elementId);

    res.status(200).json({
      success: true,
      imageId: elementId,
      message: "Image uploaded successfully",
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
    const { typeImage, elementId } = req.query;

    logger.info("Retrieving image URL", {
      typeImage,
      elementId,
    });

    const url = await getImageUrl(typeImage as string, elementId as string);

    res.status(200).json({
      success: true,
      url,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

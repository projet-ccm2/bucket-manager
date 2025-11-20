import { Storage } from "@google-cloud/storage";
import { config } from "../config/environment";
import { logger } from "../utils/logger";

const storage = new Storage({
  projectId: config.bucket.projectId,
  keyFilename: config.bucket.keyFilename,
});

const bucket = storage.bucket(config.bucket.bucketName);

export async function uploadImage(
  imageBuffer: Buffer,
  imageType: string,
  userId: string,
): Promise<string> {
  const fileName = `assets/image/${imageType}/${userId}.webp`;

  try {
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/webp",
      },
    });

    logger.info("Image uploadée avec succès", {
      fileName,
      imageType,
      userId,
    });

    return fileName;
  } catch (error) {
    logger.error("Erreur lors de l'upload de l'image", {
      error,
      fileName,
      imageType,
      userId,
    });
    throw new Error("Échec de l'upload de l'image dans le bucket");
  }
}

export async function getImageUrl(
  imageType: string,
  userId: string,
): Promise<string> {
  const fileName = `assets/image/${imageType}/${userId}.webp`;

  try {
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 3600 * 1000, // 1 heure
    });

    logger.info("URL d'image générée avec succès", {
      fileName,
      imageType,
      userId,
    });

    return url;
  } catch (error) {
    logger.error("Erreur lors de la génération de l'URL", {
      error,
      fileName,
      imageType,
      userId,
    });
    throw new Error("Échec de la récupération de l'URL de l'image");
  }
}


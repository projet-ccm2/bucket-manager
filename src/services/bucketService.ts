import { Storage } from "@google-cloud/storage";
import { config } from "../config/environment";
import { logger } from "../utils/logger";

const storageConfig: any = {
  projectId: config.bucket.projectId,
};

if (config.bucket.keyFilename && !process.env.STORAGE_EMULATOR_HOST) {
  storageConfig.keyFilename = config.bucket.keyFilename;
}

const storage = new Storage(storageConfig);
const bucket = storage.bucket(config.bucket.bucketName);

export async function uploadImage(
  imageBuffer: Buffer,
  imageType: string,
  elementId: string,
): Promise<string> {
  const fileName = `assets/image/${imageType}/${elementId}.webp`;

  try {
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: {
        contentType: "image/webp",
      },
    });

    logger.info("Image uploaded successfully", {
      fileName,
      imageType,
      elementId,
    });

    return fileName;
  } catch (error) {
    logger.error("Error uploading image", {
      error,
      fileName,
      imageType,
      elementId,
    });
    throw new Error("Failed to upload image to bucket");
  }
}

export async function getImageUrl(
  imageType: string,
  elementId: string,
): Promise<string> {
  const fileName = `assets/image/${imageType}/${elementId}.webp`;

  try {
    const file = bucket.file(fileName);

    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 3600 * 1000,
    });

    logger.info("Image URL generated successfully", {
      fileName,
      imageType,
      elementId,
    });

    return url;
  } catch (error) {
    logger.error("Error generating URL", {
      error,
      fileName,
      imageType,
      elementId,
    });
    throw new Error("Failed to retrieve image URL");
  }
}

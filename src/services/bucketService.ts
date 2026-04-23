import { Storage } from "@google-cloud/storage";
import { config } from "../config/environment";
import { logger } from "../utils/logger";

const storageConfig: any = {
  projectId: config.bucket.projectId,
};

if (config.bucket.credentials && !process.env.STORAGE_EMULATOR_HOST) {
  try {
    let credentialsString = config.bucket.credentials.trim();

    if (credentialsString.startsWith('"') && credentialsString.endsWith('"')) {
      credentialsString = JSON.parse(credentialsString);
    }

    if (credentialsString.startsWith("{") && credentialsString.endsWith("}")) {
      storageConfig.credentials = JSON.parse(credentialsString);
      logger.info("Using GCP credentials from environment variable");
    } else {
      logger.warn(
        "GCP credentials format invalid, falling back to default credentials",
        {
          credentialsPreview: credentialsString.substring(0, 50),
        },
      );
    }
  } catch (error) {
    logger.warn(
      "Failed to parse GCP credentials JSON, falling back to default credentials",
      {
        error: error instanceof Error ? error.message : String(error),
        credentialsLength: config.bucket.credentials?.length || 0,
        credentialsPreview:
          config.bucket.credentials?.substring(0, 200).replace(/\n/g, "\\n") ||
          "",
      },
    );
  }
} else if (config.bucket.keyFilename && !process.env.STORAGE_EMULATOR_HOST) {
  storageConfig.keyFilename = config.bucket.keyFilename;
  logger.info("Using GCP keyFilename for authentication");
} else if (!process.env.STORAGE_EMULATOR_HOST) {
  logger.info("Using default GCP credentials (Cloud Run service account)");
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

export async function getApkUrl(): Promise<string> {
  const fileName = "apk/app.apk";
  try {
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    if (!exists) {
      const err: any = new Error("APK not found in bucket");
      err.statusCode = 404;
      throw err;
    }
    const [url] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 3600 * 1000,
    });
    logger.info("APK URL generated successfully", { fileName });
    return url;
  } catch (error) {
    if ((error as any).statusCode === 404) throw error;
    logger.error("Error generating APK URL", { error, fileName });
    const err: any = new Error("Failed to reach Cloud Storage");
    err.statusCode = 502;
    throw err;
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

import sharp from "sharp";
import { logger } from "../utils/logger";

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
}

export function validateImageFormat(mimetype: string): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.has(mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: `Image format not allowed. Allowed formats: ${ALLOWED_FORMATS.join(", ")}`,
    };
  }
  return { isValid: true };
}

export async function convertToWebP(
  imageBuffer: Buffer,
): Promise<ProcessedImage> {
  try {
    const webpBuffer = await sharp(imageBuffer).webp().toBuffer();

    return {
      buffer: webpBuffer,
      format: "webp",
    };
  } catch (error) {
    logger.error("Error converting to WebP", { error });
    throw new Error("Failed to convert image to WebP");
  }
}

export async function checkForHiddenScripts(
  imageBuffer: Buffer,
): Promise<ImageValidationResult> {
  try {
    const bufferString = imageBuffer.toString(
      "utf8",
      0,
      Math.min(10000, imageBuffer.length),
    );

    const dangerousPatterns = [
      /<script[\s>]/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /onclick=/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(bufferString)) {
        logger.warn("Hidden script detected in image", {
          pattern: pattern.toString(),
        });
        return {
          isValid: false,
          error: "Image contains potentially dangerous hidden scripts",
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    logger.error("Error during security check", { error });
    return {
      isValid: false,
      error: "Error during image security verification",
    };
  }
}

export async function processImage(
  imageBuffer: Buffer,
): Promise<ProcessedImage> {
  const securityCheck = await checkForHiddenScripts(imageBuffer);
  if (!securityCheck.isValid) {
    throw new Error(securityCheck.error);
  }

  const processedImage = await convertToWebP(imageBuffer);

  const finalSecurityCheck = await checkForHiddenScripts(processedImage.buffer);
  if (!finalSecurityCheck.isValid) {
    throw new Error(finalSecurityCheck.error);
  }

  return processedImage;
}

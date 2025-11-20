import sharp from "sharp";
import { logger } from "../utils/logger";

const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp", "gif", "avif"];
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ProcessedImage {
  buffer: Buffer;
  format: string;
}

export function validateImageFormat(mimetype: string): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: `Format d'image non autorisé. Formats acceptés: ${ALLOWED_FORMATS.join(", ")}`,
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
    logger.error("Erreur lors de la conversion en WebP", { error });
    throw new Error("Échec de la conversion de l'image en WebP");
  }
}

export async function checkForHiddenScripts(
  imageBuffer: Buffer,
): Promise<ImageValidationResult> {
  try {
    const bufferString = imageBuffer.toString("utf8", 0, Math.min(10000, imageBuffer.length));

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
        logger.warn("Script caché détecté dans l'image", {
          pattern: pattern.toString(),
        });
        return {
          isValid: false,
          error: "L'image contient des scripts cachés potentiellement dangereux",
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    logger.error("Erreur lors de la vérification de sécurité", { error });
    return {
      isValid: false,
      error: "Erreur lors de la vérification de sécurité de l'image",
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


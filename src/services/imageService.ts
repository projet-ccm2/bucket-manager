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

const MAX_BUFFER_SIZE_TO_SCAN = 100 * 1024 * 1024;
const CHUNK_SIZE = 1024 * 1024;
const TARGET_OUTPUT_SIZE = 10 * 1024 * 1024;
const COMPRESSION_QUALITY_STEPS = [85, 70, 55, 40, 25];

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

export async function cropToSquare(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(imageBuffer).metadata();
    const size = Math.min(metadata.width!, metadata.height!);
    return await sharp(imageBuffer)
      .resize(size, size, { fit: "cover", position: "centre" })
      .toBuffer();
  } catch (error) {
    logger.error("Error cropping image to square", { error });
    throw new Error("Failed to crop image to square");
  }
}

export async function convertToWebP(
  imageBuffer: Buffer,
): Promise<ProcessedImage> {
  try {
    for (const quality of COMPRESSION_QUALITY_STEPS) {
      const webpBuffer = await sharp(imageBuffer).webp({ quality }).toBuffer();
      if (webpBuffer.length <= TARGET_OUTPUT_SIZE) {
        return { buffer: webpBuffer, format: "webp" };
      }
    }
    throw new Error("Image cannot be compressed below 10MB");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Image cannot be compressed below 10MB"
    ) {
      throw error;
    }
    logger.error("Error converting to WebP", { error });
    throw new Error("Failed to convert image to WebP");
  }
}

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

function findDangerousPattern(text: string): RegExp | undefined {
  return dangerousPatterns.find((pattern) => pattern.test(text));
}

function scanBufferChunked(imageBuffer: Buffer): ImageValidationResult {
  const OVERLAP_SIZE = 200;
  for (let offset = 0; offset < imageBuffer.length; offset += CHUNK_SIZE) {
    const chunkEnd = Math.min(offset + CHUNK_SIZE, imageBuffer.length);

    const match = findDangerousPattern(
      imageBuffer.subarray(offset, chunkEnd).toString("utf8"),
    );
    if (match) {
      logger.warn("Hidden script detected in image", {
        pattern: match.toString(),
        offset,
      });
      return {
        isValid: false,
        error: "Image contains potentially dangerous hidden scripts",
      };
    }

    if (chunkEnd < imageBuffer.length) {
      const overlapEnd = Math.min(chunkEnd + OVERLAP_SIZE, imageBuffer.length);
      const overlapMatch = findDangerousPattern(
        imageBuffer.subarray(chunkEnd, overlapEnd).toString("utf8"),
      );
      if (overlapMatch) {
        logger.warn("Hidden script detected in image overlap region", {
          pattern: overlapMatch.toString(),
          offset: chunkEnd,
        });
        return {
          isValid: false,
          error: "Image contains potentially dangerous hidden scripts",
        };
      }
    }
  }
  return { isValid: true };
}

export async function checkForHiddenScripts(
  imageBuffer: Buffer,
): Promise<ImageValidationResult> {
  try {
    if (imageBuffer.length > MAX_BUFFER_SIZE_TO_SCAN) {
      logger.warn("Image buffer exceeds maximum scan size", {
        bufferSize: imageBuffer.length,
        maxSize: MAX_BUFFER_SIZE_TO_SCAN,
      });
      return {
        isValid: false,
        error: "Image size exceeds maximum allowed size",
      };
    }

    if (imageBuffer.length <= CHUNK_SIZE) {
      const match = findDangerousPattern(imageBuffer.toString("utf8"));
      if (match) {
        logger.warn("Hidden script detected in image", {
          pattern: match.toString(),
        });
        return {
          isValid: false,
          error: "Image contains potentially dangerous hidden scripts",
        };
      }
      return { isValid: true };
    }

    return scanBufferChunked(imageBuffer);
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

  const croppedBuffer = await cropToSquare(imageBuffer);
  const processedImage = await convertToWebP(croppedBuffer);

  const finalSecurityCheck = await checkForHiddenScripts(processedImage.buffer);
  if (!finalSecurityCheck.isValid) {
    throw new Error(finalSecurityCheck.error);
  }

  return processedImage;
}

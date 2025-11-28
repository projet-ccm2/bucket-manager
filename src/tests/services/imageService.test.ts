import sharp from "sharp";
import {
  validateImageFormat,
  convertToWebP,
  checkForHiddenScripts,
  processImage,
} from "../../services/imageService";

jest.mock("sharp");
jest.mock("../../utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe("imageService", () => {
  describe("validateImageFormat", () => {
    it("should return isValid true for a valid format", () => {
      const result = validateImageFormat("image/jpeg");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return isValid true for image/png", () => {
      const result = validateImageFormat("image/png");
      expect(result.isValid).toBe(true);
    });

    it("should return isValid true for image/webp", () => {
      const result = validateImageFormat("image/webp");
      expect(result.isValid).toBe(true);
    });

    it("should return isValid true for image/gif", () => {
      const result = validateImageFormat("image/gif");
      expect(result.isValid).toBe(true);
    });

    it("should return isValid true for image/avif", () => {
      const result = validateImageFormat("image/avif");
      expect(result.isValid).toBe(true);
    });

    it("should return isValid false for an invalid format", () => {
      const result = validateImageFormat("image/bmp");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Image format not allowed");
    });

    it("should be case insensitive", () => {
      const result = validateImageFormat("IMAGE/JPEG");
      expect(result.isValid).toBe(true);
    });
  });

  describe("convertToWebP", () => {
    const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should convert an image to WebP successfully", async () => {
      const mockBuffer = Buffer.from("test-image-data");
      const mockWebpBuffer = Buffer.from("webp-image-data");

      const mockSharpInstance = {
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockWebpBuffer),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await convertToWebP(mockBuffer);

      expect(result.buffer).toEqual(mockWebpBuffer);
      expect(result.format).toBe("webp");
      expect(mockSharp).toHaveBeenCalledWith(mockBuffer);
      expect(mockSharpInstance.webp).toHaveBeenCalled();
      expect(mockSharpInstance.toBuffer).toHaveBeenCalled();
    });

    it("should throw an error if conversion fails", async () => {
      const mockBuffer = Buffer.from("test-image-data");
      const mockError = new Error("Conversion failed");

      const mockSharpInstance = {
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(mockError),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(convertToWebP(mockBuffer)).rejects.toThrow(
        "Failed to convert image to WebP",
      );
    });
  });

  describe("checkForHiddenScripts", () => {
    it("should return isValid true for a buffer without scripts", async () => {
      const safeBuffer = Buffer.from("safe image data");
      const result = await checkForHiddenScripts(safeBuffer);
      expect(result.isValid).toBe(true);
    });

    it("should detect a script tag", async () => {
      const dangerousBuffer = Buffer.from("<script>alert('xss')</script>");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("hidden scripts");
    });

    it("should detect javascript:", async () => {
      const dangerousBuffer = Buffer.from("javascript:alert('xss')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect onerror=", async () => {
      const dangerousBuffer = Buffer.from("onerror=alert('xss')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect onload=", async () => {
      const dangerousBuffer = Buffer.from("onload=alert('xss')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect onclick=", async () => {
      const dangerousBuffer = Buffer.from("onclick=alert('xss')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect eval(", async () => {
      const dangerousBuffer = Buffer.from("eval('malicious code')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect expression(", async () => {
      const dangerousBuffer = Buffer.from("expression('malicious')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect vbscript:", async () => {
      const dangerousBuffer = Buffer.from("vbscript:alert('xss')");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should detect data:text/html", async () => {
      const dangerousBuffer = Buffer.from("data:text/html,<script>alert('xss')</script>");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should be case insensitive", async () => {
      const dangerousBuffer = Buffer.from("<SCRIPT>alert('xss')</SCRIPT>");
      const result = await checkForHiddenScripts(dangerousBuffer);
      expect(result.isValid).toBe(false);
    });

    it("should return an error if verification fails", async () => {
      const mockBuffer = {
        toString: jest.fn().mockImplementation(() => {
          throw new Error("Buffer error");
        }),
        length: 100,
      } as any;

      const result = await checkForHiddenScripts(mockBuffer);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Error during image security verification");
    });
  });

  describe("processImage", () => {
    const mockSharp = sharp as jest.MockedFunction<typeof sharp>;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should process a valid image successfully", async () => {
      const mockBuffer = Buffer.from("safe image data");
      const mockWebpBuffer = Buffer.from("webp-image-data");

      const mockSharpInstance = {
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(mockWebpBuffer),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);

      const result = await processImage(mockBuffer);

      expect(result.buffer).toEqual(mockWebpBuffer);
      expect(result.format).toBe("webp");
    });

    it("should reject if scripts are detected in the original image", async () => {
      const dangerousBuffer = Buffer.from("<script>alert('xss')</script>");

      await expect(processImage(dangerousBuffer)).rejects.toThrow(
        "Image contains potentially dangerous hidden scripts",
      );
    });

    it("should reject if scripts are detected in the converted image", async () => {
      const mockBuffer = Buffer.from("safe image data");
      const dangerousWebpBuffer = Buffer.from("<script>alert('xss')</script>");

      const mockSharpInstance = {
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(dangerousWebpBuffer),
      };

      mockSharp.mockReturnValue(mockSharpInstance as any);

      await expect(processImage(mockBuffer)).rejects.toThrow(
        "Image contains potentially dangerous hidden scripts",
      );
    });
  });
});


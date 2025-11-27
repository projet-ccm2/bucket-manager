import { Storage } from "@google-cloud/storage";
import { uploadImage, getImageUrl } from "../../services/bucketService";
import { config } from "../../config/environment";

jest.mock("@google-cloud/storage");
jest.mock("../../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("bucketService - Tests unitaires", () => {
  let mockBucket: any;
  let mockFile: any;
  let mockStorage: jest.MockedClass<typeof Storage>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STORAGE_EMULATOR_HOST = "";

    mockFile = {
      save: jest.fn().mockResolvedValue(undefined),
      getSignedUrl: jest.fn().mockResolvedValue(["https://signed-url.com"]),
    };

    mockBucket = {
      file: jest.fn().mockReturnValue(mockFile),
    };

    mockStorage = Storage as jest.MockedClass<typeof Storage>;
    (mockStorage as any).mockImplementation(() => ({
      bucket: jest.fn().mockReturnValue(mockBucket),
    } as any));
  });

  afterEach(() => {
    delete process.env.STORAGE_EMULATOR_HOST;
  });

  describe("uploadImage", () => {
    it("should upload an image successfully", async () => {
      const imageBuffer = Buffer.from("test-image-data");
      const imageType = "avatar";
      const elementId = "user123";

      const result = await uploadImage(imageBuffer, imageType, elementId);

      expect(result).toBe(`assets/image/${imageType}/${elementId}.webp`);
      expect(mockBucket.file).toHaveBeenCalledWith(
        `assets/image/${imageType}/${elementId}.webp`,
      );
      expect(mockFile.save).toHaveBeenCalledWith(imageBuffer, {
        metadata: {
          contentType: "image/webp",
        },
      });
    });

    it("should handle errors during upload", async () => {
      const imageBuffer = Buffer.from("test-image-data");
      const imageType = "avatar";
      const elementId = "user123";
      const mockError = new Error("Upload failed");

      mockFile.save.mockRejectedValue(mockError);

      await expect(
        uploadImage(imageBuffer, imageType, elementId),
      ).rejects.toThrow("Failed to upload image to bucket");
    });
  });

  describe("getImageUrl", () => {
    it("should retrieve signed URL successfully", async () => {
      const imageType = "avatar";
      const elementId = "user123";

      const result = await getImageUrl(imageType, elementId);

      expect(result).toBe("https://signed-url.com");
      expect(mockBucket.file).toHaveBeenCalledWith(
        `assets/image/${imageType}/${elementId}.webp`,
      );
      expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
        action: "read",
        expires: expect.any(Number),
      });
    });

    it("should generate a URL with expiration in 1 hour", async () => {
      const imageType = "avatar";
      const elementId = "user123";
      const now = Date.now();

      await getImageUrl(imageType, elementId);

      const callArgs = mockFile.getSignedUrl.mock.calls[0][0];
      expect(callArgs.expires).toBeGreaterThan(now);
      expect(callArgs.expires).toBeLessThanOrEqual(now + 3600 * 1000);
    });

    it("should handle errors during URL retrieval", async () => {
      const imageType = "avatar";
      const elementId = "user123";
      const mockError = new Error("URL generation failed");

      mockFile.getSignedUrl.mockRejectedValue(mockError);

      await expect(getImageUrl(imageType, userId)).rejects.toThrow(
        "Failed to retrieve image URL",
      );
    });
  });
});


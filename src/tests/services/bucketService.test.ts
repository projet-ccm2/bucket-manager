const mockFile = {
  save: jest.fn().mockResolvedValue(undefined),
  getSignedUrl: jest.fn().mockResolvedValue(["https://signed-url.com"]),
};

const mockBucket = {
  file: jest.fn().mockReturnValue(mockFile),
};

const mockStorageInstance = {
  bucket: jest.fn().mockReturnValue(mockBucket),
};

const mockStorageConstructor = jest
  .fn()
  .mockImplementation(() => mockStorageInstance);

jest.mock("@google-cloud/storage", () => ({
  Storage: mockStorageConstructor,
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("bucketService - Unit tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    process.env.STORAGE_EMULATOR_HOST = "";
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";

    mockFile.save.mockResolvedValue(undefined);
    mockFile.getSignedUrl.mockResolvedValue(["https://signed-url.com"]);
    mockBucket.file.mockReturnValue(mockFile);
    mockStorageInstance.bucket.mockReturnValue(mockBucket);
  });

  afterEach(() => {
    jest.resetModules();
    delete process.env.STORAGE_EMULATOR_HOST;
    delete process.env.GCP_KEY_FILENAME;
    delete process.env.GCP_SA_KEY;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    delete process.env.GCP_SA_KEY_JSON;
    mockStorageConstructor.mockClear();
  });

  describe("uploadImage", () => {
    it("should upload an image successfully", async () => {
      const { uploadImage } = await import("../../services/bucketService");
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

      const { uploadImage } = await import("../../services/bucketService");
      await expect(
        uploadImage(imageBuffer, imageType, elementId),
      ).rejects.toThrow("Failed to upload image to bucket");
    });
  });

  describe("getImageUrl", () => {
    it("should retrieve signed URL successfully", async () => {
      const { getImageUrl } = await import("../../services/bucketService");
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
      const { getImageUrl } = await import("../../services/bucketService");
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

      const { getImageUrl } = await import("../../services/bucketService");
      await expect(getImageUrl(imageType, elementId)).rejects.toThrow(
        "Failed to retrieve image URL",
      );
    });
  });

  describe("Storage configuration", () => {
    it("should use keyFilename when provided and STORAGE_EMULATOR_HOST is not set", async () => {
      delete process.env.STORAGE_EMULATOR_HOST;
      process.env.GCP_KEY_FILENAME = "/path/to/key.json";
      process.env.GCP_PROJECT_ID = "test-project";
      process.env.GCP_BUCKET_NAME = "test-bucket";

      jest.resetModules();
      await import("../../services/bucketService");

      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-project",
          keyFilename: "/path/to/key.json",
        }),
      );
    });

    it("should not use keyFilename when STORAGE_EMULATOR_HOST is set", async () => {
      process.env.STORAGE_EMULATOR_HOST = "http://localhost:9023";
      process.env.GCP_KEY_FILENAME = "/path/to/key.json";
      process.env.GCP_PROJECT_ID = "test-project";
      process.env.GCP_BUCKET_NAME = "test-bucket";

      jest.resetModules();
      await import("../../services/bucketService");

      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-project",
        }),
      );
      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.not.objectContaining({
          keyFilename: expect.anything(),
        }),
      );
    });

    it("should use default credentials when no credentials are provided", async () => {
      delete process.env.STORAGE_EMULATOR_HOST;
      delete process.env.GCP_KEY_FILENAME;
      delete process.env.GCP_SA_KEY;
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.GCP_SA_KEY_JSON;
      process.env.GCP_PROJECT_ID = "test-project";
      process.env.GCP_BUCKET_NAME = "test-bucket";

      jest.resetModules();
      await import("../../services/bucketService");

      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-project",
        }),
      );
      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.not.objectContaining({
          keyFilename: expect.anything(),
          credentials: expect.anything(),
        }),
      );
    });

    it("should use credentials JSON when GCP_SA_KEY is provided", async () => {
      delete process.env.STORAGE_EMULATOR_HOST;
      delete process.env.GCP_KEY_FILENAME;
      process.env.GCP_PROJECT_ID = "test-project";
      process.env.GCP_BUCKET_NAME = "test-bucket";
      process.env.GCP_SA_KEY =
        '{"type":"service_account","project_id":"test-project"}';

      jest.resetModules();
      await import("../../services/bucketService");

      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-project",
          credentials: {
            type: "service_account",
            project_id: "test-project",
          },
        }),
      );
    });

    it("should prioritize credentials over keyFilename", async () => {
      delete process.env.STORAGE_EMULATOR_HOST;
      process.env.GCP_PROJECT_ID = "test-project";
      process.env.GCP_BUCKET_NAME = "test-bucket";
      process.env.GCP_KEY_FILENAME = "/path/to/key.json";
      process.env.GCP_SA_KEY =
        '{"type":"service_account","project_id":"test-project"}';

      jest.resetModules();
      await import("../../services/bucketService");

      expect(mockStorageConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: "test-project",
          credentials: {
            type: "service_account",
            project_id: "test-project",
          },
        }),
      );
      expect(mockStorageConstructor).not.toHaveBeenCalledWith(
        expect.objectContaining({
          keyFilename: expect.anything(),
        }),
      );
    });
  });
});

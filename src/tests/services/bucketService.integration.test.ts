const mockFile = {
  save: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue([true]),
  download: jest
    .fn()
    .mockResolvedValue([Buffer.from("fake-image-data-for-test")]),
  getSignedUrl: jest
    .fn()
    .mockResolvedValue([
      "https://storage.googleapis.com/test-bucket/assets/image/profile/user456.webp?X-Goog-Signature=test",
    ]),
};

const mockBucket = {
  file: jest.fn().mockReturnValue(mockFile),
  getFiles: jest.fn().mockResolvedValue([
    [
      {
        name: "assets/image/avatar/user1.webp",
        delete: jest.fn().mockResolvedValue(undefined),
      },
      {
        name: "assets/image/profile/user2.webp",
        delete: jest.fn().mockResolvedValue(undefined),
      },
    ],
  ]),
  exists: jest.fn().mockResolvedValue([true]),
  create: jest.fn().mockResolvedValue(undefined),
};

const mockStorageInstance = {
  bucket: jest.fn().mockReturnValue(mockBucket),
};

jest.mock("@google-cloud/storage", () => ({
  Storage: jest.fn().mockImplementation(() => mockStorageInstance),
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("bucketService - Integration tests", () => {
  const bucketName = "test-bucket";
  const projectId = "test-project";

  beforeAll(() => {
    process.env.GCP_PROJECT_ID = projectId;
    process.env.GCP_BUCKET_NAME = bucketName;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockFile.save.mockResolvedValue(undefined);
    mockFile.getSignedUrl.mockResolvedValue([
      "https://storage.googleapis.com/test-bucket/assets/image/profile/user456.webp?X-Goog-Signature=test",
    ]);
    mockBucket.file.mockReturnValue(mockFile);
    mockStorageInstance.bucket.mockReturnValue(mockBucket);

    delete require.cache[require.resolve("../../services/bucketService")];
    delete require.cache[require.resolve("../../config/environment")];
  });

  it("should upload an image to the bucket", async () => {
    const { uploadImage } = await import("../../services/bucketService");
    const imageBuffer = Buffer.from("fake-image-data-for-test");
    const imageType = "avatar";
    const elementId = "user123";

    const fileName = await uploadImage(imageBuffer, imageType, elementId);

    expect(fileName).toBe(`assets/image/${imageType}/${elementId}.webp`);

    expect(mockStorageInstance.bucket).toHaveBeenCalledWith(bucketName);
    expect(mockBucket.file).toHaveBeenCalledWith(fileName);
    expect(mockFile.save).toHaveBeenCalledWith(imageBuffer, {
      metadata: {
        contentType: "image/webp",
      },
    });
  });

  it("should retrieve signed URL of an uploaded image", async () => {
    const { getImageUrl } = await import("../../services/bucketService");
    const imageType = "profile";
    const elementId = "user456";

    const url = await getImageUrl(imageType, elementId);

    expect(url).toBeTruthy();
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
    expect(url).toContain("http");

    const expectedFileName = `assets/image/${imageType}/${elementId}.webp`;
    expect(mockStorageInstance.bucket).toHaveBeenCalledWith(bucketName);
    expect(mockBucket.file).toHaveBeenCalledWith(expectedFileName);
    expect(mockFile.getSignedUrl).toHaveBeenCalledWith({
      action: "read",
      expires: expect.any(Number),
    });
  });

  it("should handle multiple uploads with different types and users", async () => {
    const { uploadImage } = await import("../../services/bucketService");
    const imageBuffer1 = Buffer.from("image1-data");
    const imageBuffer2 = Buffer.from("image2-data");

    const fileName1 = await uploadImage(imageBuffer1, "avatar", "user1");
    const fileName2 = await uploadImage(imageBuffer2, "profile", "user2");

    expect(fileName1).toBe("assets/image/avatar/user1.webp");
    expect(fileName2).toBe("assets/image/profile/user2.webp");

    expect(mockFile.save).toHaveBeenCalledTimes(2);
    expect(mockFile.save).toHaveBeenNthCalledWith(1, imageBuffer1, {
      metadata: {
        contentType: "image/webp",
      },
    });
    expect(mockFile.save).toHaveBeenNthCalledWith(2, imageBuffer2, {
      metadata: {
        contentType: "image/webp",
      },
    });
  });
});

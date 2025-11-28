import { GenericContainer, StartedTestContainer } from "testcontainers";
import { Storage } from "@google-cloud/storage";

/**
 * Integration tests for bucketService
 * 
 * These tests require Docker to be running and properly configured.
 * 
 * To run these tests:
 *   - On Windows/Linux/Mac: Set DOCKER_AVAILABLE=true environment variable
 *   - Example: DOCKER_AVAILABLE=true npm test
 * 
 * They are skipped by default to avoid failures when Docker is not available
 * or not properly configured (e.g., testcontainers issues on Windows).
 */
const shouldRunTests = process.env.DOCKER_AVAILABLE === "true";

const describeIntegration = shouldRunTests ? describe : describe.skip;

describeIntegration("bucketService - Integration tests", () => {
  let container: StartedTestContainer | null = null;
  let storage: Storage | null = null;
  let uploadImage: any;
  let getImageUrl: any;
  const bucketName = "test-bucket";

  beforeAll(async () => {
    container = await new GenericContainer("fsouza/fake-gcs-server")
      .withExposedPorts(4443)
      .withCommand(["-scheme", "http", "-backend", "filesystem", "-filesystem-root", "/storage"])
      .start();

    const emulatorHost = `http://${container.getHost()}:${container.getMappedPort(4443)}`;
    process.env.STORAGE_EMULATOR_HOST = emulatorHost;
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = bucketName;

    delete require.cache[require.resolve("../../services/bucketService")];
    const bucketService = require("../../services/bucketService");
    uploadImage = bucketService.uploadImage;
    getImageUrl = bucketService.getImageUrl;

    storage = new Storage({
      projectId: "test-project",
    });

    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      await bucket.create();
    }
  }, 60000);

  afterAll(async () => {
    if (container) {
      try {
        await container.stop();
      } catch (error) {
        // Ignore errors when stopping container
      }
    }
    delete process.env.STORAGE_EMULATOR_HOST;
  });

  beforeEach(async () => {
    const bucket = storage!.bucket(bucketName);
    const [files] = await bucket.getFiles();
    await Promise.all(files.map((file) => file.delete()));
  });

  it("should upload an image to the bucket", async () => {
    const imageBuffer = Buffer.from("fake-image-data");
    const imageType = "avatar";
    const elementId = "user123";

    const fileName = await uploadImage(imageBuffer, imageType, elementId);

    expect(fileName).toBe(`assets/image/${imageType}/${elementId}.webp`);

    const bucket = storage!.bucket(bucketName);
    const file = bucket.file(fileName);
    const [exists] = await file.exists();
    expect(exists).toBe(true);

    const [contents] = await file.download();
    expect(contents).toEqual(imageBuffer);
  });

  it("should retrieve signed URL of an uploaded image", async () => {
    const imageBuffer = Buffer.from("fake-image-data");
    const imageType = "profile";
    const elementId = "user456";

    await uploadImage(imageBuffer, imageType, elementId);

    const url = await getImageUrl(imageType, elementId);

    expect(url).toBeTruthy();
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(0);
  });

  it("should handle multiple uploads with different types and users", async () => {
    const imageBuffer1 = Buffer.from("image1");
    const imageBuffer2 = Buffer.from("image2");

    const fileName1 = await uploadImage(imageBuffer1, "avatar", "user1");
    const fileName2 = await uploadImage(imageBuffer2, "profile", "user2");

    expect(fileName1).toBe("assets/image/avatar/user1.webp");
    expect(fileName2).toBe("assets/image/profile/user2.webp");

    const bucket = storage!.bucket(bucketName);
    const [files] = await bucket.getFiles();
    expect(files.length).toBe(2);
  });
});

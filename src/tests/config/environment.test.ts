import { config } from "../../config/environment";

describe("environment config", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should have a default port of 3000", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete process.env.PORT;
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.port).toBe(3000);
  });

  it("should use PORT from environment", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    process.env.PORT = "8080";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.port).toBe(8080);
  });

  it("should have nodeEnv default to development", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete process.env.NODE_ENV;
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.nodeEnv).toBe("development");
  });

  it("should use NODE_ENV from environment", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    process.env.NODE_ENV = "production";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.nodeEnv).toBe("production");
  });

  it("should have default CORS origins", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete process.env.ALLOWED_ORIGINS;
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.cors.allowedOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:8080",
      "null",
    ]);
  });

  it("should parse ALLOWED_ORIGINS from environment", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    process.env.ALLOWED_ORIGINS = "http://example.com,http://test.com";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.cors.allowedOrigins).toEqual([
      "http://example.com",
      "http://test.com",
    ]);
  });

  it("should throw error if GCP_PROJECT_ID is missing", () => {
    delete process.env.GCP_PROJECT_ID;
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete require.cache[require.resolve("../../config/environment")];
    expect(() => require("../../config/environment")).toThrow(
      "GCP_PROJECT_ID is required",
    );
  });

  it("should use GCP_PROJECT_ID from environment", () => {
    process.env.GCP_PROJECT_ID = "my-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.bucket.projectId).toBe("my-project");
  });

  it("should throw error if GCP_BUCKET_NAME is missing", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    delete process.env.GCP_BUCKET_NAME;
    delete require.cache[require.resolve("../../config/environment")];
    expect(() => require("../../config/environment")).toThrow(
      "GCP_BUCKET_NAME is required",
    );
  });

  it("should use GCP_BUCKET_NAME from environment", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "my-bucket";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.bucket.bucketName).toBe("my-bucket");
  });

  it("should have keyFilename undefined if not defined", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    delete process.env.GCP_KEY_FILENAME;
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.bucket.keyFilename).toBeUndefined();
  });

  it("should use GCP_KEY_FILENAME from environment", () => {
    process.env.GCP_PROJECT_ID = "test-project";
    process.env.GCP_BUCKET_NAME = "test-bucket";
    process.env.GCP_KEY_FILENAME = "/path/to/key.json";
    delete require.cache[require.resolve("../../config/environment")];
    const { config: testConfig } = require("../../config/environment");
    expect(testConfig.bucket.keyFilename).toBe("/path/to/key.json");
  });
});

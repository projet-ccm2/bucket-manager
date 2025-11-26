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
    delete process.env.PORT;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.port).toBe(3000);
  });

  it("should use PORT from environment", () => {
    process.env.PORT = "8080";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.port).toBe(8080);
  });

  it("should have nodeEnv default to development", () => {
    delete process.env.NODE_ENV;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.nodeEnv).toBe("development");
  });

  it("should use NODE_ENV from environment", () => {
    process.env.NODE_ENV = "production";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.nodeEnv).toBe("production");
  });

  it("should have default CORS origins", () => {
    delete process.env.ALLOWED_ORIGINS;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.cors.allowedOrigins).toEqual([
      "http://localhost:3000",
      "http://localhost:8080",
      "null",
    ]);
  });

  it("should parse ALLOWED_ORIGINS from environment", () => {
    process.env.ALLOWED_ORIGINS = "http://example.com,http://test.com";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.cors.allowedOrigins).toEqual([
      "http://example.com",
      "http://test.com",
    ]);
  });

  it("should have an empty projectId by default", () => {
    delete process.env.GCP_PROJECT_ID;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.projectId).toBe("");
  });

  it("should use GCP_PROJECT_ID from environment", () => {
    process.env.GCP_PROJECT_ID = "my-project";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.projectId).toBe("my-project");
  });

  it("should have an empty bucketName by default", () => {
    delete process.env.GCP_BUCKET_NAME;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.bucketName).toBe("");
  });

  it("should use GCP_BUCKET_NAME from environment", () => {
    process.env.GCP_BUCKET_NAME = "my-bucket";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.bucketName).toBe("my-bucket");
  });

  it("should have keyFilename undefined if not defined", () => {
    delete process.env.GCP_KEY_FILENAME;
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.keyFilename).toBeUndefined();
  });

  it("should use GCP_KEY_FILENAME from environment", () => {
    process.env.GCP_KEY_FILENAME = "/path/to/key.json";
    delete require.cache[require.resolve("../../src/config/environment")];
    const { config: testConfig } = require("../../src/config/environment");
    expect(testConfig.bucket.keyFilename).toBe("/path/to/key.json");
  });
});


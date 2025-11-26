import winston from "winston";
import { logger } from "../../utils/logger";

describe("logger", () => {
  it("should be an instance of winston Logger", () => {
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  it("should have debug level in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const loggerDev = require("../../src/utils/logger").logger;
    expect(loggerDev.level).toBe("debug");

    process.env.NODE_ENV = originalEnv;
  });

  it("should have info level in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    delete require.cache[require.resolve("../../src/utils/logger")];
    const loggerProd = require("../../src/utils/logger").logger;
    expect(loggerProd.level).toBe("info");

    process.env.NODE_ENV = originalEnv;
  });

  it("should have logging methods", () => {
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("should be able to log a message", () => {
    const spy = jest.spyOn(logger, "info");
    logger.info("Test message");
    expect(spy).toHaveBeenCalledWith("Test message");
    spy.mockRestore();
  });

  it("should be able to log with metadata", () => {
    const spy = jest.spyOn(logger, "info");
    logger.info("Test message", { key: "value" });
    expect(spy).toHaveBeenCalledWith("Test message", { key: "value" });
    spy.mockRestore();
  });
});


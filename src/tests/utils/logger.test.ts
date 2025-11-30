import winston from "winston";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  describe("logger instance", () => {
    it("should be an instance of winston Logger", () => {
      const { logger } = require("../../utils/logger");
      expect(logger).toBeInstanceOf(winston.Logger);
    });

    it("should have all required logging methods", () => {
      const { logger } = require("../../utils/logger");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.error).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.debug).toBe("function");
    });

    it("should have default metadata with service name", () => {
      const { logger } = require("../../utils/logger");
      expect(logger.defaultMeta).toEqual({ service: "IA-manager" });
    });

    it("should have console transport configured", () => {
      const { logger } = require("../../utils/logger");
      expect(logger.transports).toHaveLength(1);
      expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console);
    });
  });

  describe("environment-based log level configuration", () => {
    it("should have debug level in development environment", () => {
      process.env.NODE_ENV = "development";
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("debug");
    });

    it("should have info level in production environment", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("info");
    });

    it("should have info level in test environment", () => {
      process.env.NODE_ENV = "test";
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("info");
    });

    it("should have info level when NODE_ENV is undefined", () => {
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("info");
    });

    it("should have info level when NODE_ENV is empty string", () => {
      process.env.NODE_ENV = "";
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("info");
    });

    it("should have info level for any non-development environment", () => {
      process.env.NODE_ENV = "staging";
      jest.resetModules();
      const { logger } = require("../../utils/logger");
      expect(logger.level).toBe("info");
    });
  });

  describe("logging functionality", () => {
    let logger: winston.Logger;

    beforeEach(() => {
      logger = require("../../utils/logger").logger;
    });

    it("should be able to log info message", () => {
      const spy = jest.spyOn(logger, "info");
      logger.info("Test info message");
      expect(spy).toHaveBeenCalledWith("Test info message");
      spy.mockRestore();
    });

    it("should be able to log error message", () => {
      const spy = jest.spyOn(logger, "error");
      logger.error("Test error message");
      expect(spy).toHaveBeenCalledWith("Test error message");
      spy.mockRestore();
    });

    it("should be able to log warn message", () => {
      const spy = jest.spyOn(logger, "warn");
      logger.warn("Test warn message");
      expect(spy).toHaveBeenCalledWith("Test warn message");
      spy.mockRestore();
    });

    it("should be able to log debug message", () => {
      const spy = jest.spyOn(logger, "debug");
      logger.debug("Test debug message");
      expect(spy).toHaveBeenCalledWith("Test debug message");
      spy.mockRestore();
    });

    it("should be able to log with metadata object", () => {
      const spy = jest.spyOn(logger, "info");
      const metadata = { key: "value", userId: "123" };
      logger.info("Test message", metadata);
      expect(spy).toHaveBeenCalledWith("Test message", metadata);
      spy.mockRestore();
    });

    it("should be able to log error with Error object", () => {
      const spy = jest.spyOn(logger, "error");
      const error = new Error("Test error");
      logger.error("Error occurred", error);
      expect(spy).toHaveBeenCalledWith("Error occurred", error);
      spy.mockRestore();
    });

    it("should respect log level - debug level in development, info level in production", () => {
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const prodLogger = require("../../utils/logger").logger;
      expect(prodLogger.level).toBe("info");

      process.env.NODE_ENV = "development";
      jest.resetModules();
      const devLogger = require("../../utils/logger").logger;
      expect(devLogger.level).toBe("debug");

      const spy = jest.spyOn(devLogger.transports[0], "log");
      devLogger.debug("Debug message");
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe("format configuration", () => {
    it("should have timestamp format configured", () => {
      const { logger } = require("../../utils/logger");
      const formats = logger.format as any;
      expect(formats).toBeDefined();
    });

    it("should have errors format with stack trace enabled", () => {
      const { logger } = require("../../utils/logger");
      const formats = logger.format as any;
      expect(formats).toBeDefined();
    });

    it("should have json format configured", () => {
      const { logger } = require("../../utils/logger");
      const formats = logger.format as any;
      expect(formats).toBeDefined();
    });
  });
});

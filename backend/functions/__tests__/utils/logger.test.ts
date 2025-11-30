import { logger } from "../../src/utils/logger";
import * as functions from "firebase-functions";

// Mock do Firebase Functions Logger
jest.mock("firebase-functions", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Logger", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("info", () => {
    it("should log info message without data", () => {
      logger.info("Test message");

      expect(functions.logger.info).toHaveBeenCalledWith("Test message");
      expect(functions.logger.info).toHaveBeenCalledTimes(1);
    });

    it("should log info message with data", () => {
      const testData = { key: "value" };
      logger.info("Test message", testData);

      expect(functions.logger.info).toHaveBeenCalledWith("Test message", {
        data: testData,
      });
      expect(functions.logger.info).toHaveBeenCalledTimes(1);
    });
  });

  describe("error", () => {
    it("should log error message without error object", () => {
      logger.error("Error message");

      expect(functions.logger.error).toHaveBeenCalledWith("Error message");
      expect(functions.logger.error).toHaveBeenCalledTimes(1);
    });

    it("should log error message with Error object", () => {
      const error = new Error("Test error");
      logger.error("Error occurred", error);

      expect(functions.logger.error).toHaveBeenCalledWith("Error occurred", {
        error: "Test error",
        stack: error.stack,
      });
      expect(functions.logger.error).toHaveBeenCalledTimes(1);
    });

    it("should log error message with non-Error object", () => {
      const error = "String error";
      logger.error("Error occurred", error);

      expect(functions.logger.error).toHaveBeenCalledWith("Error occurred", {
        error: "String error",
        stack: undefined,
      });
      expect(functions.logger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("warn", () => {
    it("should log warning message without data", () => {
      logger.warn("Warning message");

      expect(functions.logger.warn).toHaveBeenCalledWith("Warning message");
      expect(functions.logger.warn).toHaveBeenCalledTimes(1);
    });

    it("should log warning message with data", () => {
      const testData = { warning: "test" };
      logger.warn("Warning message", testData);

      expect(functions.logger.warn).toHaveBeenCalledWith("Warning message", {
        data: testData,
      });
      expect(functions.logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("debug", () => {
    it("should log debug message without data", () => {
      logger.debug("Debug message");

      expect(functions.logger.debug).toHaveBeenCalledWith("Debug message");
      expect(functions.logger.debug).toHaveBeenCalledTimes(1);
    });

    it("should log debug message with data", () => {
      const testData = { debug: "info" };
      logger.debug("Debug message", testData);

      expect(functions.logger.debug).toHaveBeenCalledWith("Debug message", {
        data: testData,
      });
      expect(functions.logger.debug).toHaveBeenCalledTimes(1);
    });
  });
});


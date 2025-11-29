import { Request, Response, NextFunction } from "express";
import {
  validateInsertImage,
  validateGetImage,
  handleValidationErrors,
} from "../../middlewares/validation";
import { validationResult } from "express-validator";

jest.mock("express-validator", () => ({
  ...jest.requireActual("express-validator"),
  validationResult: jest.fn(),
  body: jest.fn((field) => ({
    notEmpty: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
  })),
  query: jest.fn((field) => ({
    notEmpty: jest.fn().mockReturnThis(),
    isString: jest.fn().mockReturnThis(),
    trim: jest.fn().mockReturnThis(),
    isLength: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
  })),
}));

jest.mock("../../utils/logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

describe("validation middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      path: "/test",
      body: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("validateInsertImage", () => {
    it("should contain validators for typeImage and elementId", () => {
      expect(validateInsertImage).toHaveLength(2);
    });
  });

  describe("validateGetImage", () => {
    it("should contain validators for typeImage and elementId in query", () => {
      expect(validateGetImage).toHaveLength(2);
    });
  });

  describe("handleValidationErrors", () => {
    it("should call next if no validation errors", () => {
      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([]),
      });

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should return a 400 error if validation errors exist", () => {
      const mockErrors = [
        {
          type: "field" as const,
          path: "typeImage",
          msg: "The 'typeImage' field is required",
        },
        {
          type: "field" as const,
          path: "elementId",
          msg: "The 'elementId' field is required",
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors),
      });

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining("Validation failed"),
        status: 400,
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should format error messages correctly", () => {
      const mockErrors = [
        {
          type: "field" as const,
          path: "typeImage",
          msg: "The 'typeImage' field is required",
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors),
      });

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining(
          "typeImage: The 'typeImage' field is required",
        ),
        status: 400,
        timestamp: expect.any(String),
      });
    });

    it("should use 'field' as default path when error type is not 'field'", () => {
      const mockErrors = [
        {
          type: "alternative" as any,
          path: "typeImage",
          msg: "Some validation error",
        },
      ];

      (validationResult as unknown as jest.Mock).mockReturnValue({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(mockErrors),
      });

      handleValidationErrors(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: expect.stringContaining("field: Some validation error"),
        status: 400,
        timestamp: expect.any(String),
      });
    });
  });
});

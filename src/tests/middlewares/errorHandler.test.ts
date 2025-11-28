import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../middlewares/errorHandler";

jest.mock("../../utils/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("errorHandler", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      path: "/test",
      method: "GET",
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    mockNext = jest.fn();
  });

  it("should handle a standard error", () => {
    const error = new Error("Test error");

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Test error",
      status: 500,
      timestamp: expect.any(String),
    });
  });

  it("should use statusCode if present in error", () => {
    const error: any = new Error("Not found");
    error.statusCode = 404;

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Not found",
      status: 404,
      timestamp: expect.any(String),
    });
  });

  it("should use a default message if error has no message", () => {
    const error: any = new Error();
    error.message = "";

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: "Internal server error",
      status: 500,
      timestamp: expect.any(String),
    });
  });

  it("should call next if headers are already sent", () => {
    mockResponse.headersSent = true;

    const error = new Error("Test error");

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      mockNext,
    );

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});


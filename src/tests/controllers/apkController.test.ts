import { Request, Response, NextFunction } from "express";
import { getApk } from "../../controllers/apkController";
import * as bucketService from "../../services/bucketService";

jest.mock("../../services/bucketService");
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("apkController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe("getApk", () => {
    it("should return 200 with signed URL on success", async () => {
      jest
        .spyOn(bucketService, "getApkUrl")
        .mockResolvedValue("https://signed-url.com/apk/app.apk");

      await getApk(mockRequest as Request, mockResponse as Response, mockNext);

      expect(bucketService.getApkUrl).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        url: "https://signed-url.com/apk/app.apk",
        timestamp: expect.any(String),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with 404 error when APK is not found", async () => {
      const err: any = new Error("APK not found in bucket");
      err.statusCode = 404;
      jest.spyOn(bucketService, "getApkUrl").mockRejectedValue(err);

      await getApk(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(err);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next with 502 error when GCS is unreachable", async () => {
      const err: any = new Error("Failed to reach Cloud Storage");
      err.statusCode = 502;
      jest.spyOn(bucketService, "getApkUrl").mockRejectedValue(err);

      await getApk(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(err);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});

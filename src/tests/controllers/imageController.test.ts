import { Request, Response, NextFunction } from "express";
import { insertImage, getImage } from "../../controllers/imageController";
import * as imageService from "../../services/imageService";
import * as bucketService from "../../services/bucketService";

jest.mock("../../services/imageService");
jest.mock("../../services/bucketService");
jest.mock("../../utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe("imageController", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      body: {},
      query: {},
      file: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe("insertImage", () => {
    it("should insert an image successfully", async () => {
      const mockFile = {
        buffer: Buffer.from("test-image"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      } as Express.Multer.File;

      const mockProcessedImage = {
        buffer: Buffer.from("webp-image"),
        format: "webp",
      };

      mockRequest.file = mockFile;
      mockRequest.body = {
        typeImage: "avatar",
        elementId: "user123",
      };

      jest
        .spyOn(imageService, "processImage")
        .mockResolvedValue(mockProcessedImage);
      jest
        .spyOn(bucketService, "uploadImage")
        .mockResolvedValue(undefined as unknown as string);

      await insertImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(imageService.processImage).toHaveBeenCalledWith(mockFile.buffer);
      expect(bucketService.uploadImage).toHaveBeenCalledWith(
        mockProcessedImage.buffer,
        "avatar",
        "user123",
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        imageId: "user123",
        message: "Image uploaded successfully",
        timestamp: expect.any(String),
      });
    });

    it("should return a 400 error if no file is provided", async () => {
      mockRequest.file = undefined;
      mockRequest.body = {
        typeImage: "avatar",
        elementId: "user123",
      };

      await insertImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No image provided",
        status: 400,
        timestamp: expect.any(String),
      });
      expect(imageService.processImage).not.toHaveBeenCalled();
    });

    it("should call next with error if processImage fails", async () => {
      const mockFile = {
        buffer: Buffer.from("test-image"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      } as Express.Multer.File;

      const mockError = new Error("Processing failed");

      mockRequest.file = mockFile;
      mockRequest.body = {
        typeImage: "avatar",
        elementId: "user123",
      };

      jest.spyOn(imageService, "processImage").mockRejectedValue(mockError);

      await insertImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });

    it("should call next with error if uploadImage fails", async () => {
      const mockFile = {
        buffer: Buffer.from("test-image"),
        originalname: "test.jpg",
        mimetype: "image/jpeg",
        size: 1024,
      } as Express.Multer.File;

      const mockProcessedImage = {
        buffer: Buffer.from("webp-image"),
        format: "webp",
      };

      const mockError = new Error("Upload failed");

      mockRequest.file = mockFile;
      mockRequest.body = {
        typeImage: "avatar",
        elementId: "user123",
      };

      jest
        .spyOn(imageService, "processImage")
        .mockResolvedValue(mockProcessedImage);
      jest.spyOn(bucketService, "uploadImage").mockRejectedValue(mockError);

      await insertImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getImage", () => {
    it("should retrieve image URL successfully", async () => {
      mockRequest.query = {
        typeImage: "avatar",
        elementId: "user123",
      };

      jest
        .spyOn(bucketService, "getImageUrl")
        .mockResolvedValue("https://signed-url.com");

      await getImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(bucketService.getImageUrl).toHaveBeenCalledWith(
        "avatar",
        "user123",
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        url: "https://signed-url.com",
        timestamp: expect.any(String),
      });
    });

    it("should call next with error if getImageUrl fails", async () => {
      mockRequest.query = {
        typeImage: "avatar",
        elementId: "user123",
      };

      const mockError = new Error("URL generation failed");
      jest.spyOn(bucketService, "getImageUrl").mockRejectedValue(mockError);

      await getImage(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});

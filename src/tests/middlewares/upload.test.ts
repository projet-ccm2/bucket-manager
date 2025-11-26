import multer from "multer";
import { upload } from "../../middlewares/upload";
import * as imageService from "../../services/imageService";

jest.mock("../../src/services/imageService");

describe("upload middleware", () => {
  let mockRequest: Partial<Express.Request>;
  let mockFile: Partial<Express.Multer.File>;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCallback = jest.fn();

    mockFile = {
      mimetype: "image/jpeg",
      originalname: "test.jpg",
      buffer: Buffer.from("test"),
      size: 1024,
    };

    mockRequest = {
      file: mockFile as Express.Multer.File,
    };
  });

  it("should accept a file with a valid format", () => {
    jest
      .spyOn(imageService, "validateImageFormat")
      .mockReturnValue({ isValid: true });

    const fileFilter = (upload as any).fileFilter;
    fileFilter(mockRequest as any, mockFile as Express.Multer.File, mockCallback);

    expect(imageService.validateImageFormat).toHaveBeenCalledWith("image/jpeg");
    expect(mockCallback).toHaveBeenCalledWith(null, true);
  });

  it("should reject a file with an invalid format", () => {
    jest
      .spyOn(imageService, "validateImageFormat")
      .mockReturnValue({
        isValid: false,
        error: "Image format not allowed",
      });

    const fileFilter = (upload as any).fileFilter;
    fileFilter(mockRequest as any, mockFile as Express.Multer.File, mockCallback);

    expect(imageService.validateImageFormat).toHaveBeenCalledWith("image/jpeg");
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Image format not allowed" }),
      false,
    );
  });

  it("should have a file size limit of 10MB", () => {
    expect(upload.limits.fileSize).toBe(10 * 1024 * 1024);
  });

  it("should use memoryStorage", () => {
    expect(upload.storage).toBeDefined();
  });
});


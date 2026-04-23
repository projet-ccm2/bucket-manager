import request from "supertest";
import express from "express";
import apkRoutes from "../../routes/apkRoutes";
import * as apkController from "../../controllers/apkController";
import { errorHandler } from "../../middlewares/errorHandler";

jest.mock("../../controllers/apkController");

const app = express();
app.use(express.json());
app.use("/bucket/apk", apkRoutes);
app.use(errorHandler);

describe("apkRoutes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /bucket/apk", () => {
    it("should call getApk and return 200", async () => {
      jest.spyOn(apkController, "getApk").mockImplementation(async (req, res) => {
        res.status(200).json({
          success: true,
          url: "https://signed-url.com/apk/app.apk",
          timestamp: new Date().toISOString(),
        });
      });

      const response = await request(app).get("/bucket/apk");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.url).toBe("https://signed-url.com/apk/app.apk");
      expect(apkController.getApk).toHaveBeenCalled();
    });

    it("should return 404 when APK is not found", async () => {
      jest.spyOn(apkController, "getApk").mockImplementation(async (req, res, next) => {
        const err: any = new Error("APK not found in bucket");
        err.statusCode = 404;
        next(err);
      });

      const response = await request(app).get("/bucket/apk");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("APK not found in bucket");
    });

    it("should return 502 when GCS is unreachable", async () => {
      jest.spyOn(apkController, "getApk").mockImplementation(async (req, res, next) => {
        const err: any = new Error("Failed to reach Cloud Storage");
        err.statusCode = 502;
        next(err);
      });

      const response = await request(app).get("/bucket/apk");

      expect(response.status).toBe(502);
      expect(response.body.error).toBe("Failed to reach Cloud Storage");
    });
  });
});

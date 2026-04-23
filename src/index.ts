import "dotenv/config";
import express from "express";
import { config } from "./config/environment";
import { logger } from "./utils/logger";
import imageRoutes from "./routes/imageRoutes";
import apkRoutes from "./routes/apkRoutes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();
app.disable("x-powered-by");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

app.use("/bucket/image", imageRoutes);
app.use("/bucket/apk", apkRoutes);

app.use(errorHandler);

if (config.nodeEnv !== "test") {
  const server = app.listen(config.port, () => {
    logger.info(`Server started on port ${config.port}`, {
      environment: config.nodeEnv,
      port: config.port,
    });
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    logger.info("SIGINT received, shutting down gracefully");
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  });
}

export default app;

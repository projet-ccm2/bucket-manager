interface Config {
  port: number;
  nodeEnv: string;
  cors: {
    allowedOrigins: string[];
  };
  bucket: {
    projectId: string;
    bucketName: string;
    keyFilename?: string;
  };
}

function validateConfig(): Config {
  return {
    port: Number.parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",")
        : ["http://localhost:3000", "http://localhost:8080", "null"],
    },
    bucket: {
      projectId: process.env.GCP_PROJECT_ID || "",
      bucketName: process.env.GCP_BUCKET_NAME || "",
      keyFilename: process.env.GCP_KEY_FILENAME,
    },
  };
}

export const config = validateConfig();

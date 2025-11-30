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
    credentials?: string;
  };
}

function validateConfig(): Config {
  const projectId = process.env.GCP_PROJECT_ID;
  const bucketName = process.env.GCP_BUCKET_NAME;

  if (!projectId) {
    throw new Error(
      "GCP_PROJECT_ID is required. Please set it in your .env file.",
    );
  }

  if (!bucketName) {
    throw new Error(
      "GCP_BUCKET_NAME is required. Please set it in your .env file.",
    );
  }

  return {
    port: Number.parseInt(process.env.PORT || "3000", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.replace(/^\[|\]$/g, "")
            .split(",")
            .map((origin) => origin.trim())
            .filter((origin) => origin.length > 0)
        : ["http://localhost:3000", "http://localhost:8080", "null"],
    },
    bucket: {
      projectId,
      bucketName,
      keyFilename: process.env.GCP_KEY_FILENAME,
      credentials:
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.GCP_SA_KEY_JSON ||
        process.env.GCP_SA_KEY,
    },
  };
}

export const config = validateConfig();

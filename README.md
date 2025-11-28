# Bucket Manager API

Image management API for Google Cloud Storage bucket with image processing, validation, and professional logging.

## Installation and Setup

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Compile TypeScript
npm run build

# Start in production
npm start
```

## Configuration

### Environment Variables

1. **Copy the example file**:

   ```bash
   cp env.example .env
   ```

2. **Configure your variables** in the `.env` file:

```bash
# Required
GCP_PROJECT_ID=your_gcp_project_id
GCP_BUCKET_NAME=your_bucket_name

# Optional
NODE_ENV=development
PORT=3000
GCP_KEY_FILENAME=path/to/key-gcp.json
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

### Google Cloud Storage Setup

1. Create a Google Cloud Storage bucket
2. Generate a service account key with Storage Admin permissions
3. Download the JSON key file and set `GCP_KEY_FILENAME` in your `.env` file
4. Set `GCP_PROJECT_ID` and `GCP_BUCKET_NAME` in your `.env` file

### Configuration Files

- `env.example`: Template with required variables
- `.env`: Your local configuration (do not commit)
- `key-gcp.json`: Google Cloud service account key file (do not commit)

## API Documentation

### Base URL

```
http://localhost:3000
```

### Endpoints

#### POST /bucket/image/insert

Upload an image to the Google Cloud Storage bucket. The image is automatically processed and converted to WebP format.

**Request:**

- **Content-Type**: `multipart/form-data`
- **Body**:
  - `image` (file, required): Image file to upload (max 10MB, formats: JPEG, PNG, WebP)
  - `typeImage` (string, required): Image type identifier (1-100 characters)
  - `elementId` (string, required): Element identifier (1-255 characters)

**Response 200 - Success:**

```json
{
  "success": true,
  "key": "assets/image/profile/user123.webp",
  "message": "Image uploaded successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response 400 - Validation Error:**

```json
{
  "error": "Validation failed: typeImage: The 'typeImage' field is required",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response 400 - No Image:**

```json
{
  "error": "No image provided",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response 500 - Upload Error:**

```json
{
  "error": "Failed to upload image to bucket",
  "status": 500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /bucket/image/get

Retrieve a signed URL for an image stored in the bucket. The URL is valid for 1 hour.

**Query Parameters:**

- `typeImage` (string, required): Image type identifier (1-100 characters)
- `elementId` (string, required): Element identifier (1-255 characters)

**Response 200 - Success:**

```json
{
  "success": true,
  "url": "https://storage.googleapis.com/bucket-name/assets/image/profile/user123.webp?X-Goog-Algorithm=...",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response 400 - Validation Error:**

```json
{
  "error": "Validation failed: typeImage: The 'typeImage' parameter is required",
  "status": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response 500 - Retrieval Error:**

```json
{
  "error": "Failed to retrieve image URL",
  "status": 500,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### GET /health

API health check.

**Response 200:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Swagger/OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: Bucket Manager API
  description: Image management API for Google Cloud Storage bucket with image processing, validation, and professional logging.
  version: 1.0.0
  contact:
    name: API Support

servers:
  - url: http://localhost:3000
    description: Development server
  - url: https://api.example.com
    description: Production server

paths:
  /health:
    get:
      summary: Health check
      description: Check the health status of the API server
      tags:
        - Health
      responses:
        '200':
          description: Server is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HealthResponse'
              example:
                status: healthy
                timestamp: '2024-01-15T10:30:00.000Z'
                environment: development

  /bucket/image/insert:
    post:
      summary: Upload an image
      description: Upload an image to the Google Cloud Storage bucket. The image is automatically processed and converted to WebP format.
      tags:
        - Images
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - image
                - typeImage
                - elementId
              properties:
                image:
                  type: string
                  format: binary
                  description: Image file to upload (max 10MB, formats: JPEG, PNG, WebP)
                typeImage:
                  type: string
                  minLength: 1
                  maxLength: 100
                  description: Image type identifier
                  example: profile
                elementId:
                  type: string
                  minLength: 1
                  maxLength: 255
                  description: Element identifier
                  example: user123
      responses:
        '200':
          description: Image uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InsertImageResponse'
              example:
                success: true
                key: assets/image/profile/user123.webp
                message: Image uploaded successfully
                timestamp: '2024-01-15T10:30:00.000Z'
        '400':
          description: Validation error or no image provided
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              examples:
                validationError:
                  value:
                    error: "Validation failed: typeImage: The 'typeImage' field is required"
                    status: 400
                    timestamp: '2024-01-15T10:30:00.000Z'
                noImage:
                  value:
                    error: No image provided
                    status: 400
                    timestamp: '2024-01-15T10:30:00.000Z'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Failed to upload image to bucket
                status: 500
                timestamp: '2024-01-15T10:30:00.000Z'

  /bucket/image/get:
    get:
      summary: Get image URL
      description: Retrieve a signed URL for an image stored in the bucket. The URL is valid for 1 hour.
      tags:
        - Images
      parameters:
        - name: typeImage
          in: query
          required: true
          description: Image type identifier
          schema:
            type: string
            minLength: 1
            maxLength: 100
          example: profile
        - name: elementId
          in: query
          required: true
          description: Element identifier
          schema:
            type: string
            minLength: 1
            maxLength: 255
          example: user123
      responses:
        '200':
          description: Image URL retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GetImageResponse'
              example:
                success: true
                url: 'https://storage.googleapis.com/bucket-name/assets/image/profile/user123.webp?X-Goog-Algorithm=...'
                timestamp: '2024-01-15T10:30:00.000Z'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: "Validation failed: typeImage: The 'typeImage' parameter is required"
                status: 400
                timestamp: '2024-01-15T10:30:00.000Z'
        '500':
          description: Internal server error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
              example:
                error: Failed to retrieve image URL
                status: 500
                timestamp: '2024-01-15T10:30:00.000Z'

components:
  schemas:
    HealthResponse:
      type: object
      properties:
        status:
          type: string
          example: healthy
        timestamp:
          type: string
          format: date-time
          example: '2024-01-15T10:30:00.000Z'
        environment:
          type: string
          example: development

    InsertImageResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        key:
          type: string
          description: Storage key/path of the uploaded image
          example: assets/image/profile/user123.webp
        message:
          type: string
          example: Image uploaded successfully
        timestamp:
          type: string
          format: date-time
          example: '2024-01-15T10:30:00.000Z'

    GetImageResponse:
      type: object
      properties:
        success:
          type: boolean
          example: true
        url:
          type: string
          description: Signed URL for the image (valid for 1 hour)
          example: 'https://storage.googleapis.com/bucket-name/assets/image/profile/user123.webp?X-Goog-Algorithm=...'
        timestamp:
          type: string
          format: date-time
          example: '2024-01-15T10:30:00.000Z'

    ErrorResponse:
      type: object
      properties:
        error:
          type: string
          description: Error message
        status:
          type: integer
          description: HTTP status code
        timestamp:
          type: string
          format: date-time
          description: Timestamp of the error
```

## Security

- **File Upload Validation**: Only JPEG, PNG, and WebP formats are accepted
- **File Size Limit**: Maximum 10MB per image
- **Image Processing**: All images are converted to WebP format for optimization
- **Signed URLs**: Image URLs are signed with expiration (1 hour)
- **Input Validation**: All inputs are validated using express-validator
- **Error Handling**: Comprehensive error handling with proper status codes
- **Logging**: Complete operation traceability

## Logging

The API uses Winston for professional logging:

- **Development**: Colored and detailed logs
- **Production**: Structured JSON logs
- **Levels**: error, warn, info, debug

Logs include:

- Image upload/download operations
- Validation errors
- GCP Storage operations
- Request/response metadata

## Testing

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with detailed coverage report
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Architecture

```
src/
├── config/           # Configuration (environment, GCP)
├── controllers/      # API controllers (image operations)
├── middlewares/      # Middlewares (upload, validation, errors)
├── routes/          # Route definitions
├── services/        # Business services (bucket, image processing)
├── utils/           # Utilities (logger)
└── tests/           # Test files
```

## Image Processing

- **Format Conversion**: All uploaded images are automatically converted to WebP format
- **Optimization**: Images are processed using Sharp library for optimal quality and size
- **Storage Path**: Images are stored at `assets/image/{typeImage}/{elementId}.webp`
- **Content Type**: All stored images have `image/webp` content type

## Error Codes

| Code | Description                  |
| ---- | ---------------------------- |
| 200  | Success                      |
| 400  | Validation error             |
| 404  | Route not found              |
| 500  | Internal server error        |
| 502  | External service error (GCP) |

## Deployment

```bash
# Build for production
npm run build

# Start in production
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t bucket-manager .

# Run container
docker run -p 3000:3000 --env-file .env bucket-manager
```

## Postman Collection

A Postman collection is available in `Bucket_Manager_API.postman_collection.json`. Import it into Postman to test the API endpoints.

The collection includes:

- Health check endpoint
- Image upload endpoint
- Image retrieval endpoint
- Pre-configured environment variables

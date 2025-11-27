import { Request, Response, NextFunction } from "express";
import { validationResult, body, query } from "express-validator";
import { logger } from "../utils/logger";

export const validateInsertImage = [
  body("typeImage")
    .notEmpty()
    .withMessage("The 'typeImage' field is required")
    .isString()
    .withMessage("The 'typeImage' field must be a string")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("The 'typeImage' field must contain between 1 and 100 characters"),
  body("elementId")
    .notEmpty()
    .withMessage("The 'elementId' field is required")
    .isString()
    .withMessage("The 'elementId' field must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("The 'elementId' field must contain between 1 and 255 characters"),
];

export const validateGetImage = [
  query("typeImage")
    .notEmpty()
    .withMessage("The 'typeImage' parameter is required")
    .isString()
    .withMessage("The 'typeImage' parameter must be a string")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("The 'typeImage' parameter must contain between 1 and 100 characters"),
  query("elementId")
    .notEmpty()
    .withMessage("The 'elementId' parameter is required")
    .isString()
    .withMessage("The 'elementId' parameter must be a string")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("The 'elementId' parameter must contain between 1 and 255 characters"),
];

export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((err) => `${err.type === "field" ? err.path : "field"}: ${err.msg}`)
      .join(", ");

    logger.warn("Validation error", {
      errors: errors.array(),
      path: req.path,
    });

    res.status(400).json({
      error: `Validation failed: ${errorMessages}`,
      status: 400,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}


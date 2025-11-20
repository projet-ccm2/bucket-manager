import { Request, Response, NextFunction } from "express";
import { validationResult, body, query } from "express-validator";
import { logger } from "../utils/logger";

export const validateInsertImage = [
  body("typeImage")
    .notEmpty()
    .withMessage("Le champ 'typeImage' est requis")
    .isString()
    .withMessage("Le champ 'typeImage' doit être une chaîne de caractères")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le champ 'typeImage' doit contenir entre 1 et 100 caractères"),
  body("userId")
    .notEmpty()
    .withMessage("Le champ 'userId' est requis")
    .isString()
    .withMessage("Le champ 'userId' doit être une chaîne de caractères")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Le champ 'userId' doit contenir entre 1 et 255 caractères"),
];

export const validateGetImage = [
  query("typeImage")
    .notEmpty()
    .withMessage("Le paramètre 'typeImage' est requis")
    .isString()
    .withMessage("Le paramètre 'typeImage' doit être une chaîne de caractères")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Le paramètre 'typeImage' doit contenir entre 1 et 100 caractères"),
  query("userId")
    .notEmpty()
    .withMessage("Le paramètre 'userId' est requis")
    .isString()
    .withMessage("Le paramètre 'userId' doit être une chaîne de caractères")
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("Le paramètre 'userId' doit contenir entre 1 et 255 caractères"),
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

    logger.warn("Erreur de validation", {
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


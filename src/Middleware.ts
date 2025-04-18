import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key";

interface DecodedToken {
  id: string;
}

const PUBLIC_ROUTES = ["/api/v1/signin", "/api/v1/signup"];

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Skip middleware for public routes
    if (PUBLIC_ROUTES.includes(req.path)) {
      return next();
    }

    const header = req.headers["authorization"];

    if (!header) {
      res.status(401).json({ message: "Authorization header missing" });
      return;
    }

    const tokenParts = header.split(" ");

    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      res.status(401).json({ message: "Token missing or invalid format" });
      return;
    }

    const token = tokenParts[1];

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    if (!decoded || !decoded.id) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    (req as any).user = { id: decoded.id };

    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

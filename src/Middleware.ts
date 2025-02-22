import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";

interface DecodedToken {
  id: string;
}

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
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

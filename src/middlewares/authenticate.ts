import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utlis/tokens";
import { ApiError } from "../utlis/ApiError";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No access token provided");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "No access token provided");
  }

  try {
    const decoded = verifyAccessToken(token) as {
      id: string;
      email: string;
      role: string;
      permissions: string[];
    };

    req.user = decoded;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token");
  }
};

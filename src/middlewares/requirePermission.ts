import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utlis/ApiError";

export const requirePermission = (atom: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permissions = req.user?.permissions ?? [];

    if (!permissions.includes(atom)) {
      throw new ApiError(403, `Access denied — missing permission: ${atom}`);
    }

    next();
  };
};

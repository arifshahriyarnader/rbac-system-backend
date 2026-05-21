import { Request, Response } from "express";
import { sendResponse } from "../../utlis/apiResponse";
import { asyncHandler } from "../../utlis/asyncHandler";
import { getAllPermissions } from "./permissions.service";

export const getAllPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getAllPermissions();

    sendResponse(res, 200, "Permissions fetched successfully", data);
  },
);

import { Request, Response } from "express";
import { sendResponse } from "../../utlis/apiResponse";
import { asyncHandler } from "../../utlis/asyncHandler";
import { getAllPermissions, getPermissionById } from "./permissions.service";

export const getAllPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getAllPermissions();

    sendResponse(res, 200, "Permissions fetched successfully", data);
  },
);

export const getPermissionByIdController = asyncHandler(
  async (req: Request, res: Response) => {

    const id = req.params.id as string;

    const permission = await getPermissionById(id);

    sendResponse(
      res,
      200,
      "Permission fetched successfully",
      { permission }
    );
  }
);
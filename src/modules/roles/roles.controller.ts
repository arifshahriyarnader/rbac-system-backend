import { Request, Response } from "express";
import { sendResponse } from "../../utlis/apiResponse";
import { asyncHandler } from "../../utlis/asyncHandler";
import { getAllRoles } from "./roles.service";

export const getAllRolesController = asyncHandler(
  async (req: Request, res: Response) => {
    const roles = await getAllRoles();
    sendResponse(res, 200, "Roles fetched successfully", { roles });
  }
);
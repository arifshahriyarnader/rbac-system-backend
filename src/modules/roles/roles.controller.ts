import { Request, Response } from "express";
import { sendResponse } from "../../utlis/apiResponse";
import { asyncHandler } from "../../utlis/asyncHandler";
import { getAllRoles, getRoleById } from "./roles.service";

export const getAllRolesController = asyncHandler(
  async (req: Request, res: Response) => {
    const roles = await getAllRoles();
    sendResponse(res, 200, "Roles fetched successfully", { roles });
  }
);

export const getRoleByIdController = asyncHandler(
    async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const role = await getRoleById(id)
        sendResponse(res, 200, "Role fetched successfully", { role });
    }
)
import { Request, Response } from "express";
import { sendResponse } from "../../utlis/apiResponse";
import { asyncHandler } from "../../utlis/asyncHandler";
import {
  assignPermissionToRole,
  getAllRoles,
  getRoleById,
  getRolePermissions,
} from "./roles.service";
import { ApiError } from "../../utlis/ApiError";

export const getAllRolesController = asyncHandler(
  async (req: Request, res: Response) => {
    const roles = await getAllRoles();
    sendResponse(res, 200, "Roles fetched successfully", { roles });
  },
);

export const getRoleByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const role = await getRoleById(id);
    sendResponse(res, 200, "Role fetched successfully", { role });
  },
);

export const getRolePermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const data = await getRolePermissions(id);
    sendResponse(res, 200, "Role permissions fetched successfully", data);
  },
);

export const assignPermissionToRoleController = asyncHandler(
  async (req: Request, res: Response) => {
    const roleId = req.params.id as string;
    const { permissionId } = req.body;

    if (!permissionId) {
      throw new ApiError(400, "permissionId is required");
    }

    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const result = await assignPermissionToRole(roleId, permissionId, caller);

    sendResponse(res, 201, result.message, result);
  },
);

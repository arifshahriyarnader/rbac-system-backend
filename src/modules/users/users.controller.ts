import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { sendResponse } from "../../utlis/apiResponse";
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserPermissions,
  overrideUserPermission,
  removeUserPermissionOverride,
  updateUser,
  updateUserStatus,
} from "./users.service";

export const getAllUsersController = asyncHandler(
  async (req: Request, res: Response) => {
    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const users = await getAllUsers(caller);

    sendResponse(res, 200, "Users fetched successfully", { users });
  },
);

export const getUserByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };
    const user = await getUserById(id, caller);
    sendResponse(res, 200, "User fetched successfully", { user });
  },
);

export const createUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const user = await createUser(req.body, caller);

    sendResponse(res, 201, "User created successfully", { user });
  },
);

export const updateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const user = await updateUser(id, req.body, caller);

    sendResponse(res, 200, "User updated successfully", { user });
  },
);

export const suspendUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const caller = { id: req.user!.id, role: req.user!.role };

    const user = await updateUserStatus(id, "suspended", caller);

    sendResponse(res, 200, "User suspended successfully", { user });
  },
);

export const banUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const caller = { id: req.user!.id, role: req.user!.role };

    const user = await updateUserStatus(id, "banned", caller);

    sendResponse(res, 200, "User banned successfully", { user });
  },
);

export const activateUserController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const caller = { id: req.user!.id, role: req.user!.role };

    const user = await updateUserStatus(id, "active", caller);

    sendResponse(res, 200, "User activated successfully", { user });
  },
);

export const getUserPermissionsController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const caller = { id: req.user!.id, role: req.user!.role };

    const data = await getUserPermissions(userId, caller);

    sendResponse(res, 200, "User permissions fetched successfully", data);
  },
);

export const overrideUserPermissionController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const { permissionId, granted } = req.body;
    const caller = { id: req.user!.id, role: req.user!.role };

    const result = await overrideUserPermission(
      userId,
      permissionId,
      granted,
      caller,
    );

    sendResponse(
      res,
      200,
      granted
        ? `Permission ${result.atom} granted successfully`
        : `Permission ${result.atom} revoked successfully`,
      result,
    );
  },
);

export const removeUserPermissionOverrideController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.params.id as string;
    const permissionId = req.params.permId as string;
    const caller = { id: req.user!.id, role: req.user!.role };

    const result = await removeUserPermissionOverride(
      userId,
      permissionId,
      caller,
    );

    sendResponse(res, 200, result.message, result);
  },
);

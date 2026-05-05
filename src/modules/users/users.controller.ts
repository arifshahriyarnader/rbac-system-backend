import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { sendResponse } from "../../utlis/apiResponse";
import { getAllUsers, getUserById } from "./users.service";

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

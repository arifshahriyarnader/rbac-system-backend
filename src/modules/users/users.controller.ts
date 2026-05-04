import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { sendResponse } from "../../utlis/apiResponse";
import { getAllUsers } from "./users.service";

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

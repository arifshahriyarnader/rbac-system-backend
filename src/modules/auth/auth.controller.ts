import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { getMe, login, logout, refreshToken } from "./auth.service";
import { ApiError } from "../../utlis/ApiError";
import { sendResponse } from "../../utlis/apiResponse";
import { send } from "node:process";

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const ip = req.ip;

    const result = await login(req.body, ip);

    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendResponse(res, 200, "Login successful", {
      accessToken: result.accessToken,
      user: result.user,
    });
  },
);

export const logoutController = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new ApiError(400, "No refresh token found");
    }

    await logout(refreshToken);
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    sendResponse(res, 200, "Logged out successfully");
  },
);

export const refreshTokenController = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new ApiError(400, "No refresh token found");
    }
    const result = await refreshToken(token);
    sendResponse(res, 200, "Token refreshed successfully", {
      accessToken: result.accessToken,
      user: result.user,
    });
  },
);

export const getMeController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const user = await getMe(userId);
    sendResponse(res, 200, "User fetched successfully", { user });
  },
);

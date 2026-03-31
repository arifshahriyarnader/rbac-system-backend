import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { login, logout } from "./auth.service";
import { ApiError } from "../../utlis/ApiError";

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

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
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
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  },
);

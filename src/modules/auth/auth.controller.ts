import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { login } from "./auth.service";

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

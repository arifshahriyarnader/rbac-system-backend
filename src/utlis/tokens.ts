import jwt from "jsonwebtoken";

export const generateAccessToken = (payload: {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (payload: { id: string }): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
};

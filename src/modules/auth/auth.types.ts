import { z } from "zod";
import { loginSchema } from "./auth.validator";

export type LoginInput = z.infer<typeof loginSchema>;

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

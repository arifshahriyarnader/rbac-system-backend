import bcrypt from "bcrypt";
import { databaseConnection } from "../../database/connection";
import { ApiError } from "../../utlis/ApiError";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utlis/tokens";
import { LoginInput } from "./auth.types";
import { th } from "zod/locales";

export const login = async (data: LoginInput, ip?: string) => {
  const { email, password } = data;

  const userResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.password_hash,
      u.status,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.email = $1`,
    [email],
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (user.status === "suspended") {
    throw new ApiError(403, "Your account has been suspended");
  }

  if (user.status === "banned") {
    throw new ApiError(403, "Your account has been banned");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const permissionsResult = await databaseConnection.query(
    `SELECT DISTINCT p.atom
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u ON u.role_id = rp.role_id
     LEFT JOIN user_permissions up
       ON up.permission_id = p.id
       AND up.user_id = $1
     WHERE u.id = $1
     AND COALESCE(up.granted, true) = true`,
    [user.id],
  );

  const permissions = permissionsResult.rows.map(
    (row: { atom: string }) => row.atom,
  );

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions,
  });

  const refreshToken = generateRefreshToken({
    id: user.id,
  });

  await databaseConnection.query(
    `INSERT INTO sessions (user_id, refresh_token, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
    [user.id, refreshToken],
  );

  await databaseConnection.query(
    `UPDATE users
     SET last_login = NOW()
     WHERE id = $1`,
    [user.id],
  );

  await databaseConnection.query(
    `INSERT INTO audit_logs
      (actor_id, action, module, metadata, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      "user.login",
      "auth",
      JSON.stringify({ email: user.email }),
      ip ?? null,
    ],
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    },
  };
};

export const logout = async (refreshToken: string) => {
  const sessionResult = await databaseConnection.query(
    `SELECT id, user_id FROM sessions WHERE refresh_token = $1 AND is_revoked = false`,
    [refreshToken],
  );
  const session = sessionResult.rows[0];

  if (!session) {
    throw new ApiError(401, "Invalid or expired session");
  }

  await databaseConnection.query(
    `UPDATE sessions SET is_revoked = true WHERE refresh_token = $1`,
    [refreshToken],
  );
  await databaseConnection.query(
    `INSERT INTO audit_logs (actor_id, action, module, metadata, ip_address) VALUES ($1, $2, $3, $4, $5)`,
    [
      session.user_id,
      "user.logout",
      "auth",
      JSON.stringify({ sessionId: session.id }),
      null,
    ],
  );
};

export const refreshToken = async (token: string) => {
  if (!token) {
    throw new ApiError(401, "No refresh token provided");
  }
  const sessionResult = await databaseConnection.query(
    `
    SELECT s.id, s.user_id, s.is_revoked, s.expires_at
    FROM sessions s
    WHERE s.refresh_token = $1
  `,
    [token],
  );
  const session = sessionResult.rows[0];
  if (!session) {
    throw new ApiError(401, "Invalid refresh token");
  }
  if (session.is_revoked) {
    throw new ApiError(401, "Refresh token has been revoked");
  }
  if (new Date() > new Date(session.expires_at)) {
    throw new ApiError(401, "Refresh token has expired");
  }

  let decoded: any;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }

  const userResult = await databaseConnection.query(
    `SELECT
      u.id,
      u.name,
      u.email,
      u.status,
      r.name AS role
     FROM users u
     JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [session.user_id],
  );
  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (user.status === "suspended") {
    throw new ApiError(403, "Your account has been suspended");
  }

  if (user.status === "banned") {
    throw new ApiError(403, "Your account has been banned");
  }
  const permissionsResult = await databaseConnection.query(
    `SELECT DISTINCT p.atom
     FROM permissions p
     JOIN role_permissions rp ON rp.permission_id = p.id
     JOIN users u ON u.role_id = rp.role_id
     LEFT JOIN user_permissions up
       ON up.permission_id = p.id
       AND up.user_id = $1
     WHERE u.id = $1
     AND COALESCE(up.granted, true) = true`,
    [user.id],
  );

  const permissions = permissionsResult.rows.map(
    (row: { atom: string }) => row.atom,
  );
  const newAccessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions,
  });
  return {
    accessToken: newAccessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions,
    },
  };
};

import { Request, Response } from "express";
import { asyncHandler } from "../../utlis/asyncHandler";
import { sendResponse } from "../../utlis/apiResponse";
import { AuditLogFilters } from "./auditLog.types";
import { getAuditLogs } from "./auditLog.service";

export const getAuditLogsController = asyncHandler(
  async (req: Request, res: Response) => {
    const filters: AuditLogFilters = {
      userId: req.query.userId as string | undefined,
      module: req.query.module as string | undefined,
      action: req.query.action as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const caller = {
      id: req.user!.id,
      role: req.user!.role,
    };

    const data = await getAuditLogs(filters, caller);

    sendResponse(res, 200, "Audit logs fetched successfully", data);
  },
);

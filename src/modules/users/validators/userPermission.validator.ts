import { z } from "zod";

export const userPermissionSchema = z.object({
  permissionId: z
    .string({ error: "permissionId is required" })
    .uuid("Invalid permission ID format"),

  granted: z.boolean({
    error: "granted must be true or false",
  }),
});

export type UserPermissionInput = z.infer<typeof userPermissionSchema>;
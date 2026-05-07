import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be less than 100 characters")
      .trim()
      .optional(),

    email: z
      .string()
      .email("Invalid email format")
      .toLowerCase()
      .trim()
      .optional(),
    password: z
      .string()
      .min(10, "Password must be at least 10 characters")
      .optional(),
    role: z.enum(["manager", "agent", "customer"]).optional(),
    managerId: z.string().uuid("Invalid manager ID format").optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

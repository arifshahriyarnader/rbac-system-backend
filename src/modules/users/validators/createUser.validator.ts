import { z } from "zod";

export const createUserSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .min(4, "Name must be at least 4 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),

  email: z
    .string({ error: "Email is required" })
    .email("Invalid email format")
    .toLowerCase()
    .trim(),

  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),

  role: z.enum(["manager", "agent", "customer"], {
    error: "Role must be manager, agent or customer",
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

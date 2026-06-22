import { z } from "zod";

export const loginSchema = z.object({
  pn: z.string().min(1, "Personal Number is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  pn: z.string().min(1, "Personal Number is required"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const workspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required").max(100),
  icon: z.string().optional(),
});

export const projectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["active", "archived", "completed"]).optional(),
  isFavorite: z.boolean().optional(),
});

export const taskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1, "Task title is required").max(500),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().positive().optional().nullable(),
  parentId: z.string().optional().nullable(),
  order: z.number().optional(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export const commentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  image: z.string().url().optional().nullable(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

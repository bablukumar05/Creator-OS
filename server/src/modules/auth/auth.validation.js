import { z } from 'zod';
export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .regex(/[a-z]/, 'Add a lowercase letter')
  .regex(/[A-Z]/, 'Add an uppercase letter')
  .regex(/\d/, 'Add a number')
  .regex(/[^a-zA-Z0-9]/, 'Add a special character');
export const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
export const otpSchema = z.object({ email: emailSchema, otp: z.string().regex(/^\d{6}$/) });
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
    password: passwordSchema,
    confirmPassword: z.string(),
    terms: z.literal(true),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export const loginSchema = z.object({
  identifier: z.string().min(1).max(254),
  password: z.string().min(1).max(100),
  remember: z.boolean().optional(),
});
export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  avatar: z
    .url()
    .refine((value) => /^https?:/.test(value))
    .or(z.literal(''))
    .optional(),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  password: passwordSchema,
});
export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export const sessionIdSchema = z.string().min(1);
export const deleteAccountSchema = z.object({ confirmation: z.literal('DELETE') });
export const forgotPasswordSchema = z.object({ email: emailSchema });
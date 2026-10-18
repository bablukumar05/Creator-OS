import { z } from 'zod';
const password = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use at most 72 characters.')
  .regex(/[a-z]/, 'Add a lowercase letter.')
  .regex(/[A-Z]/, 'Add an uppercase letter.')
  .regex(/\d/, 'Add a number.')
  .regex(/[^a-zA-Z0-9]/, 'Add a special character.');
export function validatePassword(value) {
  const result = password.safeParse(value);
  return result.success || result.error.issues[0].message;
}
import mongoose from 'mongoose';
import { z } from 'zod';
import { INVITABLE_ROLES, MEMBER_STATUSES, ORGANIZATION_ROLES } from './member.types.js';
export const memberIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid member ID.');
export const roleSchema = z.enum(ORGANIZATION_ROLES);
export const invitableRoleSchema = z.enum(INVITABLE_ROLES);
export const memberStatusSchema = z.enum(MEMBER_STATUSES);
export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: invitableRoleSchema.default('creator'),
  permissions: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
});
export const acceptInviteSchema = z.object({
  token: z.string().trim().min(16).max(256),
});
export const updateMemberSchema = z
  .object({
    role: invitableRoleSchema.optional(),
    status: z.enum(['active', 'suspended', 'removed']).optional(),
    permissions: z.array(z.string().trim().min(1).max(100)).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one membership field to update',
  });

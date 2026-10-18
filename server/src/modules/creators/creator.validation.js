import mongoose from 'mongoose';
import { z } from 'zod';
import { platforms } from '../../../../shared/resources.js';
export const creatorIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid record ID.');
export const creatorProfilePayloadSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Display name is required').max(200),
    username: z.string().trim().min(2).max(100).regex(/^[a-z0-9_.-]+$/i, 'Invalid username format'),
    bio: z.string().trim().max(2000).optional(),
    profileImage: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    coverImage: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    categories: z.array(z.string()).optional(),
    niches: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    location: z.string().trim().max(200).optional(),
    country: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    contentTypes: z.array(z.string()).optional(),
    platforms: z.array(z.enum(platforms)).optional(),
    website: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    portfolioUrl: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    headline: z.string().trim().max(500).optional(),
    featuredVideoUrl: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    highlights: z
      .array(
        z.object({
          label: z.string().trim(),
          value: z.string().trim(),
        }),
      )
      .optional(),
    pastCollaborations: z
      .array(
        z.object({
          brandName: z.string().trim(),
          logo: z.string().trim().optional(),
          deliverableType: z.string().trim().optional(),
          views: z.string().trim().optional(),
          date: z.string().trim().optional(),
          testimonial: z.string().trim().optional(),
        }),
      )
      .optional(),
    isPublic: z.boolean().optional(),
    availabilityStatus: z.enum(['Available', 'Busy', 'Unavailable', 'On Leave']).optional(),
    minimumBudget: z.coerce.number().min(0).optional(),
  })
  .strict();
export const inboundInquiryPayloadSchema = z
  .object({
    brandName: z.string().trim().min(1, 'Brand name is required').max(200),
    contactName: z.string().trim().min(1, 'Contact person name is required').max(200),
    contactEmail: z.string().trim().email('Valid work email is required'),
    brandWebsite: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    serviceType: z.string().trim().max(200).optional(),
    budget: z.coerce.number().min(0).optional(),
    timeline: z.string().trim().max(200).optional(),
    message: z.string().trim().max(5000).optional(),
  })
  .strict();
export const socialAccountPayloadSchema = z
  .object({
    platform: z.enum(platforms),
    username: z.string().trim().min(1),
    profileUrl: z.string().trim().url('Invalid URL').or(z.literal('')).optional(),
    followers: z.coerce.number().min(0).optional(),
    following: z.coerce.number().min(0).optional(),
    totalPosts: z.coerce.number().min(0).optional(),
    engagementRate: z.coerce.number().min(0).max(100).optional(),
    verified: z.boolean().optional(),
  })
  .strict();
export const rateCardPayloadSchema = z
  .object({
    currency: z.string().trim().max(10).optional(),
    minimumBudget: z.coerce.number().min(0).optional(),
    negotiable: z.boolean().optional(),
    services: z
      .array(
        z.object({
          platform: z.enum(platforms),
          contentType: z.string().trim().min(1),
          basePrice: z.coerce.number().min(0),
          turnaroundDays: z.coerce.number().min(1).optional(),
        }),
      )
      .min(1),
  })
  .strict();

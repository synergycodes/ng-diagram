import { z } from 'zod';

export const GetDocInputSchema = z.object({
  path: z
    .string({ required_error: 'Path parameter is required' })
    .min(1, 'Path parameter is required')
    .max(500, 'Path parameter is too long (max 500 characters)')
    .refine((v) => v.trim().length > 0, 'Path parameter cannot be empty')
    .transform((v) => v.trim())
    .refine((v) => !v.includes('\0'), 'Path contains invalid characters')
    .refine((v) => {
      const normalized = v.replace(/\\/g, '/');
      return !normalized.includes('..') && !normalized.startsWith('/');
    }, 'Path must be a relative path within the docs directory'),
});

export type GetDocInput = z.infer<typeof GetDocInputSchema>;

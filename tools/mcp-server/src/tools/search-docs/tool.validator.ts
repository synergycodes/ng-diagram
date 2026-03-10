import { z } from 'zod';

export const SearchDocsInputSchema = z.object({
  query: z
    .string({ required_error: 'Query parameter is required' })
    .min(1, 'Query parameter is required')
    .max(1000, 'Query parameter is too long (max 1000 characters)')
    .refine((v) => v.trim().length > 0, 'Query parameter cannot be empty')
    .transform((v) => v.trim()),
  limit: z
    .number({ invalid_type_error: 'Limit parameter must be a non-negative number' })
    .finite('Limit parameter must be a non-negative number')
    .int('Limit parameter must be a non-negative number')
    .min(0, 'Limit parameter must be a non-negative number')
    .max(100, 'Limit parameter must not exceed 100')
    .optional(),
});

export type SearchDocsInput = z.infer<typeof SearchDocsInputSchema>;

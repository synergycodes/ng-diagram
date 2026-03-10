import { z } from 'zod';

const VALID_KINDS = ['class', 'function', 'interface', 'type', 'const', 'enum'] as const;

export const SearchSymbolsInputSchema = z.object({
  query: z
    .string({ required_error: 'Query parameter is required' })
    .min(1, 'Query parameter is required')
    .max(1000, 'Query parameter is too long (max 1000 characters)')
    .refine((v) => v.trim().length > 0, 'Query parameter cannot be empty')
    .transform((v) => v.trim()),
  kind: z
    .enum(VALID_KINDS, { message: `Invalid kind parameter. Must be one of: ${VALID_KINDS.join(', ')}` })
    .optional(),
  limit: z
    .number({ invalid_type_error: 'Limit parameter must be a non-negative number' })
    .finite('Limit parameter must be a non-negative number')
    .int('Limit parameter must be a non-negative number')
    .min(0, 'Limit parameter must be a non-negative number')
    .max(100, 'Limit parameter must not exceed 100')
    .optional(),
});

export type SearchSymbolsInput = z.infer<typeof SearchSymbolsInputSchema>;

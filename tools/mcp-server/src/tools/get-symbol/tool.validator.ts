import { z } from 'zod';

export const GetSymbolInputSchema = z.object({
  name: z
    .string({ required_error: 'Name parameter is required' })
    .min(1, 'Name parameter is required')
    .max(200, 'Name parameter is too long (max 200 characters)')
    .refine((v) => v.trim().length > 0, 'Name parameter cannot be empty')
    .transform((v) => v.trim()),
});

export type GetSymbolInput = z.infer<typeof GetSymbolInputSchema>;

import { z } from 'zod';

export const signupSchema = z.object({
	name: z.string().trim().min(2).max(60),
	email: z.string().trim().toLowerCase().pipe(z.email()),
	password: z.string().min(8).max(100),
	organizationId: z.uuid(),
});

export const loginSchema = z.object({
	email: z.string().trim().toLowerCase().pipe(z.email()),
	password: z.string().min(1).max(100),
});

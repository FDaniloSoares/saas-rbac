'use server';

import { HTTPError } from 'ky';
import { z } from 'zod';

import { signUp } from '@/http/sign-up';

const signUpSchema = z
  .object({
    name: z.string().refine((value) => value.split(' ').length > 1, {
      error: 'Please, entrer your first and last name',
    }),
    email: z.email({ message: 'Please, provide a valid e-mail address.' }),
    password: z
      .string()
      .min(6, { message: 'Password shloud have ate least 6 characteres' }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    error: 'Password confirmation does not match',
    path: ['password_confirmation'],
  });

export async function signUpAction(data: FormData) {
  const result = signUpSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    const { fieldErrors: errors } = z.flattenError(result.error);

    return { success: false, message: null, errors };
  }

  const { name, email, password } = result.data;

  try {
    await signUp({ name, email, password });
  } catch (error) {
    if (error instanceof HTTPError) {
      const { message } = (error.data ?? {}) as { message?: string };

      return {
        success: false,
        message: message ?? 'Unexpected error, try again in a few minutes.',
        errors: null,
      };
    }

    console.error(error);

    return {
      success: false,
      message: 'Unexpected error, try again in a few minutes.',
      errors: null,
    };
  }

  return { success: true, message: null, errors: null };
}

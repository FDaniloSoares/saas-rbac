'use server';

import { HTTPError } from 'ky';
import { z } from 'zod';

import { getCurrentOrg } from '@/auth/auth';
import { createProject } from '@/http/create-project';

const projectSchema = z.object({
  name: z.string().min(4, { message: 'Please include at least 4 characteres' }),
  description: z
    .string()
    .min(4, { message: 'Please include at least 4 characteres' }),
});

export async function createProjectAction(data: FormData) {
  const result = projectSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    const { fieldErrors: errors } = z.flattenError(result.error);

    return { success: false, message: null, errors };
  }

  const { name, description } = result.data;

  try {
    const org = await getCurrentOrg();

    if (!org) {
      return {
        success: false,
        message: 'No organization selected.',
        errors: null,
      };
    }

    await createProject({ org, name, description });
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

  return {
    success: true,
    message: 'Successfully saved project',
    errors: null,
  };
}

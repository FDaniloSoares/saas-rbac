'use server';

import { HTTPError } from 'ky';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { signInWithPassword } from '@/http/sign-in-with-password';

const signInSchema = z.object({
  email: z.email({ message: 'Please, provide a valid e-mail address.' }),
  password: z.string().min(1, { message: 'Please, provide your password.' }),
});

export async function signInWithEmailAndPassword(data: FormData) {
  // a forma normal de FormData é [ ['nome', 'pedro'] ['password', 'passDo Pedro'] ]
  // por isso usamos Object.fromEntries para montar um objeto

  // way to wait 2s sincronously
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const result = signInSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    // zod 4: error.flatten() foi depreciado -> usar z.flattenError()
    // (a alternativa sugerida no aviso é z.treeifyError(), que devolve
    // uma árvore: tree.properties?.email?.errors)
    const { fieldErrors: errors } = z.flattenError(result.error);

    return { success: false, message: null, errors };
  }

  // aqui email e password já saíram validados e tipados como string
  const { email, password } = result.data;

  try {
    const { token } = await signInWithPassword({ email, password });

    (await cookies()).set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch (error) {
    if (error instanceof HTTPError) {
      // ky v2 já lê o corpo da resposta de erro para preencher `error.data`,
      // então `error.response.json()` falha com "Body has already been read".
      // `data` vem como objeto (se o content-type for JSON), string ou undefined.
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

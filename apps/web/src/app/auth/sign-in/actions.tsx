'use server';

import { signInWithPassword } from '@/http/sign-in-with-password';

export async function signInWithEmailAndPassword(
  previousState: unknown,
  data: FormData
) {
  console.log(previousState);

  // a forma normal de FormData é [ ['nome', 'pedro'] ['password', 'passDo Pedro'] ]
  // por isso usamos Object.fromEntries para montar um objeto

  // way to wait 2s sincronously
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { email, password } = Object.fromEntries(data);

  // email e password sao do tipo FormDataEntryValue (Object)
  // mas como tem a funcao toString ele onde for usado como string nao reclama
  // pois JS trnasforma para string

  console.log(Object.fromEntries(data));

  const result = signInWithPassword({
    email: String(email),
    password: String(password),
  });

  console.log('result: ', result);

  return 'OK';
}

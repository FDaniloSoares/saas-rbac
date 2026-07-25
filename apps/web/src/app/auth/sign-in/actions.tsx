'use server';

import ky from 'ky';

const api = ky.create({
  prefix: 'http://localhost:3333',
});

export async function signInWithEmailAndPassword(data: FormData) {
  // a forma normal de FormData é [ ['nome', 'pedro'] ['password', 'passDo Pedro'] ]
  // por isso usamos Object.fromEntries para montar um objeto

  const { email, password } = Object.fromEntries(data);

  // email e password sao do tipo FormDataEntryValue (Object)
  // mas como tem a funcao toString ele onde for usado como string nao reclama
  // pois JS trnasforma para string

  console.log(Object.fromEntries(data));

  const response = await api
    .post('sessions/password', {
      json: {
        email,
        password,
      },
    })
    .json();

  console.log('respose: ', response);
}

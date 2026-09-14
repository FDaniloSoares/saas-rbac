/* nada de Fastify aqui: emitir um token deixou de exigir um objeto de resposta
na mão. quem assina é um adaptador, e ele é que conhece a tecnologia */
export interface TokenSigner {
  sign(payload: { sub: string }): Promise<string>;
}

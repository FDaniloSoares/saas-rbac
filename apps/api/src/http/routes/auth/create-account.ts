import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from  'zod';

export async function CreateAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/users', {
    schema: {
      body: z.object({
        name: z.string(),
        email: z.email(),
        password: z.string().min(6)
      })
    }
  }, () => {
    return 'User created'
  });  
}
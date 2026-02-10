import 'dotenv/config';
import { fastify } from 'fastify';
import fastifyCors from '@fastify/cors';
import {
  // jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { CreateAccount } from './routes/auth/create-account';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.register(fastifyCors);

app.register(CreateAccount);

app.listen({ port: 3333 }).then(() => {
  console.log('Http server running!');
});

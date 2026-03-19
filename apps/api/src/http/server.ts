import 'dotenv/config';
import { fastify } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { CreateAccount } from './routes/auth/create-account';
import { authenticateWithPassword } from './routes/auth/authenticate-with-password';
import { getProfile } from './routes/auth/get-profile';
import { errorHandler } from './error-handler';
import { requestPasswordRecover } from './routes/auth/request-password-recover';
import { resetPassword } from './routes/auth/reset-password';
import { authenticateWithGithub } from './routes/auth/authenticate-with-github';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);
app.setErrorHandler(errorHandler);

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'RBAC SaaS API',
      description: 'Full-stack app with multi-tenant & RBAC',
      version: '1.0.0',
    },
    servers: [],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: '/swagger',
});

app.register(fastifyJwt, {
  secret: 'my-jwt-secret',
});

app.register(fastifyCors);

app.register(CreateAccount);
app.register(authenticateWithPassword);
app.register(authenticateWithGithub);
app.register(getProfile);
app.register(requestPasswordRecover);
app.register(resetPassword);

const port = 3333;
app.listen({ port }).then(() => {
  console.log(`Http server running in port ${port}!`);
});

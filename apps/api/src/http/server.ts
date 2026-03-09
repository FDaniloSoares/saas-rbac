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
import { authenticateWithPassord } from './routes/auth/authenticate-with-password';
import { getProfile } from './routes/auth/get-profile';

const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

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
app.register(authenticateWithPassord);
app.register(getProfile);

app.listen({ port: 3333 }).then(() => {
  console.log('Http server running!');
});

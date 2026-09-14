import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyWebsocket from '@fastify/websocket';
import { env } from '@saas/env';
import { fastify } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

import { githubOAuthHttp } from '@/adapters/github-oauth-http';
import { mailerConsole } from '@/adapters/mailer-console';
import { tokenSignerFastifyJwt } from '@/adapters/token-signer-fastify-jwt';
import type { GithubOAuth } from '@/ports/github-oauth';
import type { Mailer } from '@/ports/mailer';

import { errorHandler } from './error-handler';
import { authenticateWithGithub } from './routes/auth/authenticate-with-github';
import { authenticateWithPassword } from './routes/auth/authenticate-with-password';
import { CreateAccount } from './routes/auth/create-account';
import { getProfile } from './routes/auth/get-profile';
import { requestPasswordRecover } from './routes/auth/request-password-recover';
import { resetPassword } from './routes/auth/reset-password';
import { getOrganizationBilling } from './routes/billing/get-organization-billing';
import { getConversationMessages } from './routes/chat/get-conversation-messages';
import { getConversations } from './routes/chat/get-conversations';
import { acceptInvite } from './routes/invites/accept-invite';
import { createInvite } from './routes/invites/create-invite';
import { getInvite } from './routes/invites/get-invite';
import { getInvites } from './routes/invites/get-invites';
import { getPendingInvite } from './routes/invites/get-prending-invites';
import { rejectInvite } from './routes/invites/reject-invite';
import { revokeInvite } from './routes/invites/revoke-invite';
import { getMembers } from './routes/members/get-members';
import { removeMember } from './routes/members/remove-member';
import { upadateMember } from './routes/members/update-member';
import { createOrganization } from './routes/orgs/create-organization';
import { getMembership } from './routes/orgs/get-menbership';
import { getOrganization } from './routes/orgs/get-organization';
import { getOrganizations } from './routes/orgs/get-organizations';
import { shutdownOrganization } from './routes/orgs/shutdown-organization';
import { transferOrganization } from './routes/orgs/transfer-organization';
import { updateOrganization } from './routes/orgs/update-organization';
import { createProject } from './routes/projects/create-project';
import { deleteProject } from './routes/projects/delete-project';
import { getProject } from './routes/projects/get-project';
import { getProjects } from './routes/projects/get-projects';
import { organizationSocket } from './routes/ws/organization-socket';

export interface AppPorts {
  github: GithubOAuth;
  mailer: Mailer;
}

/* os adaptadores reais sao o default; o teste passa falsos pelo mesmo
parametro, entao producao e suite montam a app pelo mesmo caminho */
export function buildApp(ports: Partial<AppPorts> = {}) {
  const app = fastify().withTypeProvider<ZodTypeProvider>();

  const github = ports.github ?? githubOAuthHttp;
  const mailer = ports.mailer ?? mailerConsole;
  const tokenSigner = tokenSignerFastifyJwt(app);

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
    secret: env.JWT_SECRET,
  });

  app.register(fastifyCors);
  app.register(fastifyWebsocket);

  app.register(CreateAccount);
  app.register(authenticateWithPassword({ tokenSigner }));
  app.register(authenticateWithGithub({ github, tokenSigner }));
  app.register(getProfile);
  app.register(requestPasswordRecover({ mailer }));
  app.register(resetPassword);

  app.register(createOrganization);
  app.register(getMembership);
  app.register(getOrganization);
  app.register(getOrganizations);
  app.register(updateOrganization);
  app.register(shutdownOrganization);
  app.register(transferOrganization);

  app.register(createProject);
  app.register(deleteProject);
  app.register(getProjects);
  app.register(getProject);

  app.register(getMembers);
  app.register(upadateMember);
  app.register(removeMember);

  app.register(createInvite);
  app.register(getInvite);
  app.register(getInvites);
  app.register(acceptInvite);
  app.register(rejectInvite);
  app.register(revokeInvite);
  app.register(getPendingInvite);

  app.register(getOrganizationBilling);

  app.register(getConversations);
  app.register(getConversationMessages);

  app.register(organizationSocket);

  return app;
}

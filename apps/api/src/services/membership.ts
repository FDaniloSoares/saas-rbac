import { prisma } from '@/lib/prisma';

import { UnauthorizedError } from '../http/routes/_errors/unauthorized-error';

/* a regra de "este usuário pertence a esta organização" vivia num decorator de
`request`, então o WebSocket não conseguia usá-la e reescreveu a consulta. aqui
ela não sabe o que é uma request, e os dois transportes chamam a mesma coisa */

/* lança: quem chama quer 401 — rotas HTTP e o handshake do socket */
export async function getMembership({
  userId,
  slug,
}: {
  userId: string;
  slug: string;
}) {
  const member = await prisma.member.findFirst({
    where: {
      userId,
      organization: { slug },
    },
    include: {
      organization: true,
    },
  });

  if (!member) {
    throw new UnauthorizedError('You are not the father!!!');
  }

  const { organization, ...membership } = member;

  return { organization, membership };
}

/* devolve null: quem chama quer mapear o erro do próprio jeito — o evento de
chat responde com RECIPIENT_NOT_FOUND, a rota HTTP com 400 */
export async function findMembership({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  return prisma.member.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
    select: { userId: true },
  });
}

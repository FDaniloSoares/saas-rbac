'use server';

import { Role, roleSchema } from '@saas/auth';
import { HTTPError } from 'ky';
import { revalidateTag } from 'next/cache';
import z from 'zod';

import { getCurrentOrg } from '@/auth/auth';
import { createInvite } from '@/http/create-invite';
import { removeMember } from '@/http/remove-member';
import { revokeInvite } from '@/http/revoke-invite';
import { updateMember } from '@/http/update-member';

const inviteSchema = z.object({
  email: z.email({ message: 'Invalid e-mail adress.' }),
  role: roleSchema,
});

export async function createInviteAction(data: FormData) {
  const result = inviteSchema.safeParse(Object.fromEntries(data));

  if (!result.success) {
    const { fieldErrors: errors } = z.flattenError(result.error);

    return { success: false, message: null, errors };
  }

  const { email, role } = result.data;

  try {
    const org = await getCurrentOrg();

    if (!org) {
      return {
        success: false,
        message: 'No organization selected.',
        errors: null,
      };
    }

    await createInvite({ org, email, role });

    revalidateTag(`${org}/invites`);
  } catch (error) {
    if (error instanceof HTTPError) {
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

  return {
    success: true,
    message: 'Successfully create invite',
    errors: null,
  };
}

export async function removeMemberAction(memberId: string) {
  const currentOrg = await getCurrentOrg();

  await removeMember({
    org: currentOrg!,
    memberId,
  });

  revalidateTag(`${currentOrg}/members`);
}

export async function updateMemberAction(memberId: string, role: Role) {
  const currentOrg = await getCurrentOrg();

  await updateMember({
    org: currentOrg!,
    memberId,
    role,
  });

  revalidateTag(`${currentOrg}/members`);
}

export async function revokeInviteAction(inviteId: string) {
  const currentOrg = await getCurrentOrg();

  await revokeInvite({
    org: currentOrg!,
    inviteId,
  });

  revalidateTag(`${currentOrg}/invites`);
}

import { defineAbilityFor } from '@saas/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getMembership } from '@/http/get-membership';
import { getProfile } from '@/http/get-profille';

export async function isAuthenticated() {
  return !!(await cookies()).get('token')?.value;
}

export async function getCurrentOrg() {
  return (await cookies()).get('org')?.value ?? null;
}

export async function getCurrantMembership() {
  const org = await getCurrentOrg();

  if (!org) {
    return null;
  }

  const { membership } = await getMembership(org);

  return membership;
}

export async function ablility() {
  const membership = await getCurrantMembership();

  if (!membership) {
    return null;
  }

  const ability = defineAbilityFor({
    id: membership.userId,
    role: membership.role,
  });

  return ability;
}

export async function auth() {
  const token = (await cookies()).get('token')?.value;

  if (!token) {
    redirect('/auth/sign-in');
  }

  try {
    const { user } = await getProfile();

    return { user };
  } catch {
    /* DO NOTHING */
  }

  redirect('/api/auth/sign-out');
}

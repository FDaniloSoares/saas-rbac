import { redirect } from 'next/navigation';

import { getCurrantMembership } from '@/auth/auth';
import { AppShell } from '@/components/app-shell';
import { Tabs } from '@/components/tabs';

export default async function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const membership = await getCurrantMembership();

  if (!membership) {
    redirect('/');
  }

  return (
    <AppShell>
      <Tabs />
      {children}
    </AppShell>
  );
}

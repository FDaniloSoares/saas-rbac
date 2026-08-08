import { AppShell } from '@/components/app-shell';
import { Tabs } from '@/components/tabs';

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppShell>
      <Tabs />
      {children}
    </AppShell>
  );
}

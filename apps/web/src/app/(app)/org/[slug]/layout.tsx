import { AppShell } from '@/components/app-shell';

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}

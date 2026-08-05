import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/auth/auth';

export default async function AppLayout({
  children,
  sheet,
}: Readonly<{
  children: React.ReactNode;
  sheet: React.ReactNode;
}>) {
  if (!(await isAuthenticated())) {
    redirect('/auth/sign-in');
  }

  return (
    <div className="space-y-4 py-4">
      {children}
      {sheet}
    </div>
  );
}

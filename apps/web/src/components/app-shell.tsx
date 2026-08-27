import Chat from '@/app/(app)/chat/chat';

import { Header } from './header';

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-6">
          <main className="mx-auto w-full max-w-300">{children}</main>
        </div>
        <div className="absolute inset-y-0 right-0 z-50">
          <Chat />
        </div>
      </div>
    </>
  );
}

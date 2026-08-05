import { Header } from './header';

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-300">{children}</main>
    </>
  );
}

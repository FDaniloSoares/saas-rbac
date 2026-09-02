import Chat from '@/app/(app)/chat/chat';
import { ability, auth, getCurrentOrg } from '@/auth/auth';
import { getMembers } from '@/http/get-members';

import { Header } from './header';
import { ChatProvider } from './ws/chat-provider';

export async function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const org = await getCurrentOrg();
  const { user } = await auth();

  const permissions = await ability();
  const canListMembers = permissions?.can('get', 'User') ?? false;

  const { members } =
    org && canListMembers ? await getMembers(org) : { members: [] };
  const contacts = members.filter((member) => member.userId !== user.id);

  return (
    <ChatProvider slug={org} currentUserId={user.id}>
      <Header />
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-6">
          <main className="mx-auto w-full max-w-300">{children}</main>
        </div>
        <div className="absolute inset-y-0 right-0 z-50">
          <Chat org={org} contacts={contacts} />
        </div>
      </div>
    </ChatProvider>
  );
}

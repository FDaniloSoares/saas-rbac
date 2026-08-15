import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { getInvite } from '@/http/get-invite';

dayjs.extend(relativeTime);

interface InvitePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { id: inviteId } = await params;

  const { invite } = await getInvite(inviteId);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col justify-center space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="size-16">
            {invite.author?.avatarUrl && (
              <AvatarImage src={invite.author.avatarUrl} />
            )}
            <AvatarFallback />
          </Avatar>

          <p className="text-muted-foreground text-center leading-relaxed text-balance">
            <span className="text-foreground font-medium">
              {invite.author?.name ?? 'Someone'}
            </span>{' '}
            invited you to join{' '}
            <span className="text-foreground font-medium">
              {invite.organization.name}
            </span>
            .{' '}
            <span className="text-xs">{dayjs(invite.createdAt).fromNow()}</span>
          </p>
        </div>

        <Separator />
      </div>
    </div>
  );
}

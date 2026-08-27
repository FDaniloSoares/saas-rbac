import { LogOut } from 'lucide-react';

import { auth } from '@/auth/auth';
import { getInitials } from '@/lib/utils';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export async function ProfileButton() {
  const { user } = await auth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex cursor-pointer items-center gap-3 outline-none">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-muted-foreground text-xs">{user.email}</span>
        </div>
        <Avatar>
          {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
          {/* <AvatarImage src="https://github.com/fdanilosoares.png" /> */}
          <AvatarFallback>{getInitials(user.name ?? 's n')}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-0">
        <DropdownMenuItem className="cursor-pointer px-3">
          <a
            href="/api/auth/sign-out"
            className="flex w-full items-center justify-end gap-2"
          >
            <LogOut className="size-4" />
            Sign Out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

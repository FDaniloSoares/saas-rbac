import { ChevronsUpDown, PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { getOrganizations } from '@/http/get-organizations';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export async function OrganizationSwitcher() {
  const { organizations } = await getOrganizations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-primary flex w-42 items-center gap-2 rounded p-1 text-sm font-medium outline-none focus-visible:ring-2">
        <span className="text-muted-foreground">Select organization</span>
        <ChevronsUpDown className="ml-auto size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50" alignOffset={-16}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {organizations.map((org) => {
            return (
              <DropdownMenuItem
                key={org.id}
                render={<Link href={`/org/${org.slug}`} />}
              >
                <Avatar className="mr-2 size-5">
                  {org.avatarUrl && <AvatarImage src={org.avatarUrl} />}
                  <AvatarFallback />
                </Avatar>
                <span className="line-clamp-1">{org.nome}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/create-organization" />}>
          <PlusCircle className="mr-2 size-5" />
          Create new
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

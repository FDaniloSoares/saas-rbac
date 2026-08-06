'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getProjects } from '@/http/get-projects';

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

export function ProjectSwitcher() {
  const { slug: orgSlug } = useParams<{
    slug: string;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: [orgSlug, 'projects'],
    queryFn: () => getProjects(orgSlug),
    enabled: !!orgSlug,
  });

  console.log(data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-primary flex w-42 items-center gap-2 rounded p-1 text-sm font-medium outline-none focus-visible:ring-2">
        {/* {curretOrganization ? (
          <>
            <Avatar className="mr-2 size-5">
              {curretOrganization.avatarUrl && (
                <AvatarImage src={curretOrganization.avatarUrl} />
              )}
              <AvatarFallback />
            </Avatar>
            <span className="truncate text-left">
              {curretOrganization.name}
            </span>
          </>
        ) : ( */}
        <span className="text-muted-foreground">Select project</span>
        {/* )} */}
        <ChevronsUpDown className="ml-auto size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50" alignOffset={-16}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
          {/* {organizations.map((org) => {
            return ( */}
          <DropdownMenuItem
            // key={org.id}
            render={<Link href={'/'} />}
          >
            <Avatar className="mr-2 size-5">
              <AvatarImage src={'https://teste.com'} />
              <AvatarFallback />
            </Avatar>
            <span className="line-clamp-1">Projeto teste</span>
          </DropdownMenuItem>
          {/* ); */}
          {/* })} */}
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

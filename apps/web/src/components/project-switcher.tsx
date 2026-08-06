'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2, PlusCircle } from 'lucide-react';
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
import { Skeleton } from './ui/skeleton';

export function ProjectSwitcher() {
  const { slug: orgSlug, projSlug } = useParams<{
    slug: string;
    projSlug: string;
  }>();

  const { data, isLoading } = useQuery({
    queryKey: [orgSlug, 'projects'],
    queryFn: () => getProjects(orgSlug),
    enabled: !!orgSlug,
  });

  const currentProject =
    data && projSlug
      ? data.projects.find((project) => project.slug === projSlug)
      : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-primary flex w-42 items-center gap-2 rounded p-1 text-sm font-medium outline-none focus-visible:ring-2">
        {isLoading ? (
          <>
            <Skeleton className="size-5 shrink-0 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </>
        ) : (
          <>
            {currentProject ? (
              <>
                <Avatar className="size-5">
                  {currentProject.avatarUrl && (
                    <AvatarImage src={currentProject.avatarUrl} />
                  )}
                  <AvatarFallback />
                </Avatar>
                <span className="truncate text-left">
                  {currentProject.name}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">Select project</span>
            )}
          </>
        )}
        {isLoading ? (
          <Loader2 className="ml-auto size-4 shrink-0 animate-spin" />
        ) : (
          <ChevronsUpDown className="ml-auto size-4 shrink-0" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-50" alignOffset={-16}>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Projects</DropdownMenuLabel>
          {data &&
            data.projects.map((project) => {
              return (
                <DropdownMenuItem
                  key={project.id}
                  render={
                    <Link href={`/org/${orgSlug}/project/${project.slug}`} />
                  }
                >
                  <Avatar className="mr-2 size-5">
                    {project.avatarUrl && (
                      <AvatarImage src={project.avatarUrl} />
                    )}
                    <AvatarFallback />
                  </Avatar>
                  <span className="line-clamp-1">{project.name}</span>
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href={`/org/${orgSlug}/create-project`} />}
        >
          <PlusCircle className="mr-2 size-5" />
          Create new
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

import { Plus } from 'lucide-react';
import Link from 'next/link';

import { ability, getCurrentOrg } from '@/auth/auth';
import { Button } from '@/components/ui/button';

import { ProjectList } from './project-list';

export default async function Projects() {
  const permissions = await ability();
  const currentOrg = await getCurrentOrg();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Projects</h1>

        {permissions?.can('create', 'Project') && (
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href={`${currentOrg}/create-project`} />}
          >
            <Plus className="mr-2 size-4" />
            Create project
          </Button>
        )}
      </div>

      {permissions?.can('get', 'Project') ? (
        <ProjectList />
      ) : (
        <p className="text-muted-foreground text-sm">
          Your are not allowed to see organization projects
        </p>
      )}
    </div>
  );
}

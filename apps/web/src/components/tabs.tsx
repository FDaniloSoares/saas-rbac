import { ability, getCurrentOrg } from '@/auth/auth';

import { NavLink } from './nav-link';
import { Button } from './ui/button';

export async function Tabs() {
  const currentOrg = await getCurrentOrg();

  const permissions = await ability();

  const canGetProjects = permissions?.can('get', 'Project');
  const canGetMembers = permissions?.can('get', 'User');
  const canUpadateOrganization = permissions?.can('update', 'Organization');
  const canGetBilling = permissions?.can('get', 'Billing');

  return (
    <div className="mb-2 border-b pb-1">
      <nav className="mx-auto flex max-w-300 items-center gap-2">
        {canGetProjects && (
          <Button
            variant="ghost"
            nativeButton={false}
            size="sm"
            className="data-[current=true]:border-border text-muted-foreground data-[current=true]:text-foreground border border-transparent"
            render={<NavLink href={`/org/${currentOrg}`} />}
          >
            Projects
          </Button>
        )}

        {canGetMembers && (
          <Button
            variant="ghost"
            nativeButton={false}
            size="sm"
            className="data-[current=true]:border-border text-muted-foreground data-[current=true]:text-foreground border border-transparent"
            render={<NavLink href={`/org/${currentOrg}/members`} />}
          >
            Members
          </Button>
        )}

        {(canUpadateOrganization || canGetBilling) && (
          <Button
            variant="ghost"
            nativeButton={false}
            size="sm"
            className="data-[current=true]:border-border text-muted-foreground data-[current=true]:text-foreground border border-transparent"
            render={<NavLink href={`/org/${currentOrg}/settings`} />}
          >
            Settings & Billing
          </Button>
        )}
      </nav>
    </div>
  );
}

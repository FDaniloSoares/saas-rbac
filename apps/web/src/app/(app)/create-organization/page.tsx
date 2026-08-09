import { AppShell } from '@/components/app-shell';

import { OrganizationForm } from '../org/organization-form';

export default function CreateOrganization() {
  return (
    <AppShell>
      <div className="mx-auto w-2/3 space-y-4">
        <h1 className="text-2xl font-bold">Create Organization</h1>
        <OrganizationForm />
      </div>
    </AppShell>
  );
}

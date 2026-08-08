import { ability } from '@/auth/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { OrganizationForm } from '../../organization-form';

export default async function Settings() {
  const permissions = await ability();

  const canUpadateOrganization = permissions?.can('update', 'Organization');
  const canGetBilling = permissions?.can('get', 'Billing');
  const canShutdownOrganization = permissions?.can('delete', 'Organization');

  return (
    <div className="mx-auto w-full max-w-300">
      <h1 className="mb-3 text-xl font-bold">Settings</h1>

      <div className="space-y-4">
        {canUpadateOrganization && (
          <Card>
            <CardHeader>
              <CardTitle>Organizations setting</CardTitle>
              <CardDescription>
                Upadate your organization details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationForm />
            </CardContent>
          </Card>
        )}

        {canGetBilling && <div>Billing</div>}

        {canShutdownOrganization && (
          <Card>
            <CardHeader>
              <CardTitle>Shutdown organization</CardTitle>
              <CardDescription>
                This will delete all organization data includin all projects.
                You cannot undo this action.
              </CardDescription>
            </CardHeader>
            <CardContent></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

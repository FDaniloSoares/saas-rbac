import { ability, getCurrentOrg } from '@/auth/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getOrganization } from '@/http/get-organization';

import { OrganizationForm } from '../../organization-form';
import { Billing } from './billing';
import { ShutdownOrganizationButton } from './shutdown-organization-button';

export default async function Settings() {
  const currentOrg = await getCurrentOrg();
  const permissions = await ability();

  const canUpadateOrganization = permissions?.can('update', 'Organization');
  const canGetBilling = permissions?.can('get', 'Billing');
  const canShutdownOrganization = permissions?.can('delete', 'Organization');

  const { organization } = await getOrganization(currentOrg!);

  return (
    <div>
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
              <OrganizationForm
                isUpdatings
                initialData={{
                  name: organization.name,
                  domain: organization.domain,
                  shouldAttachUsersByDomain:
                    organization.shouldAttachUsersByDomain,
                }}
              />
            </CardContent>
          </Card>
        )}

        {canGetBilling && <Billing />}

        {canShutdownOrganization && (
          <Card>
            <CardHeader>
              <CardTitle>Shutdown organization</CardTitle>
              <CardDescription>
                This will delete all organization data includin all projects.
                You cannot undo this action.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ShutdownOrganizationButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

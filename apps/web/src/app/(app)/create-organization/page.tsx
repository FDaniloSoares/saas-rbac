import { OrganizationForm } from './organization-form';

export default async function CreateOrganization() {
  return (
    <div className="mx-auto w-2/3 space-y-4">
      <h1 className="text-2xl font-bold">Create Organization</h1>
      <OrganizationForm />
    </div>
  );
}

import { CircleXIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { shutdownOrganizationAction } from './actions';

export function ShutdownOrganizationButton() {
  return (
    <form action={shutdownOrganizationAction}>
      <Button type="submit" variant="destructive" className="w-56 px-4">
        <CircleXIcon className="size-4" />
        Shutdown organization
      </Button>
    </form>
  );
}

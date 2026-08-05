'use client';

import { useRouter } from 'next/navigation';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { OrganizationForm } from '../../create-organization/organization-form';

export default function CreateOrganization() {
  const router = useRouter();

  return (
    <Sheet defaultOpen onOpenChange={(open) => !open && router.back()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Create organization</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto px-4 pb-4">
          <OrganizationForm />
        </div>
      </SheetContent>
    </Sheet>
  );
}

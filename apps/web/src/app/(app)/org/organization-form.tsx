'use client';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormState } from '@/hooks/use-form-state';

import {
  createOrganizationAction,
  organizationSchema,
  updateOrganizationAction,
} from './actions';

interface OrganizarionFormProps {
  isUpdatings?: boolean;
  initialData?: organizationSchema;
}

export function OrganizationForm({
  isUpdatings = false,
  initialData,
}: OrganizarionFormProps) {
  const formAction = !isUpdatings
    ? createOrganizationAction
    : updateOrganizationAction;

  const [defaultValues] = useState(initialData);

  const [{ success, message, errors }, handleSignIn, isPending] =
    useFormState(formAction);

  return (
    <form onSubmit={handleSignIn} className="space-y-4 text-xl">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Save organization faild!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}
      {success === true && message && (
        <Alert variant="success">
          <AlertTriangle className="size-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            <p>{message}</p>
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-1">
        <Label htmlFor="name">Organization name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Organization name"
          defaultValue={defaultValues?.name}
        ></Input>
        {errors?.name && (
          <p className="text-xs font-medium text-red-50 dark:text-red-400">
            {errors.name[0]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor="domain">E-mail domain</Label>
        <Input
          type="domain"
          id="domain"
          name="domain"
          inputMode="url"
          placeholder="example.com"
          defaultValue={defaultValues?.domain ?? undefined}
        ></Input>
        {errors?.domain && (
          <p className="text-xs font-medium text-red-50 dark:text-red-400">
            {errors.domain[0]}
          </p>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline space-x-2">
          <Checkbox
            name="shouldAttachUsersByDomain"
            id="shouldAttachUsersByDomain"
            defaultChecked={defaultValues?.shouldAttachUsersByDomain}
          />
          <label htmlFor="shouldAttachUsersByDomain" className="space-y-1">
            <span className="text-sm leading-none font-medium">
              Auto-join new members
            </span>
            <p className="text-muted-foreground text-xs">
              This will automatically invite all members with same e-mail domain
              ti this organization.
            </p>
          </label>
        </div>
        {errors?.shouldAttachUsersByDomain && (
          <p className="text-xs font-medium text-red-50 dark:text-red-400">
            {errors.shouldAttachUsersByDomain[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Save Organization
      </Button>
    </form>
  );
}

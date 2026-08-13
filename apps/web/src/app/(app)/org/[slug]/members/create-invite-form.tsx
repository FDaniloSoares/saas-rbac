'use client';
import { AlertTriangle, Loader2, UserPlus } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFormState } from '@/hooks/use-form-state';

import { createInviteAction } from './actions';

export function CreateInviteForm() {
  const [{ success, message, errors }, handleSignIn, isPending] =
    useFormState(createInviteAction);

  return (
    <form onSubmit={handleSignIn} className="space-y-4 text-xl">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Invite faild!</AlertTitle>
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

      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="sir@example.com"
          />
          {errors?.email && (
            <p className="text-xs font-medium text-red-50 dark:text-red-400">
              {errors.email[0]}
            </p>
          )}
        </div>

        <Select name="role" defaultValue="MEMBER">
          <SelectTrigger className="w-26">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="MEMBER">Member</SelectItem>
            <SelectItem value="BILLING">Billing</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          <UserPlus />
          Invite user
        </Button>
      </div>
    </form>
  );
}

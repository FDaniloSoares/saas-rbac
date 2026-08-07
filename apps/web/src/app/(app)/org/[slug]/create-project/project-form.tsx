'use client';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormState } from '@/hooks/use-form-state';
import { queryClient } from '@/lib/react-query';

import { createProjectAction } from './actions';

export function ProjectForm() {
  const { slug: org } = useParams<{ slug: string }>();

  const [{ success, message, errors }, handleSignIn, isPending] = useFormState(
    createProjectAction,
    () => {
      queryClient.invalidateQueries({
        queryKey: [org, 'projects'],
      });
    }
  );

  return (
    <form onSubmit={handleSignIn} className="space-y-4 text-xl">
      {success === false && message && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Save project faild!</AlertTitle>
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
        <Label htmlFor="name">Project name</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Organization name"
        ></Input>
        {errors?.name && (
          <p className="text-xs font-medium text-red-50 dark:text-red-400">
            {errors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea name="description" id="description" />
        {errors?.description && (
          <p className="text-xs font-medium text-red-50 dark:text-red-400">
            {errors.description[0]}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Save Project
      </Button>
    </form>
  );
}

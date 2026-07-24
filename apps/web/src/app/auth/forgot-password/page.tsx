import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignInPage() {
  return (
    <form action="" className="w-full max-w-sm space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">E-mail</Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
        ></Input>
      </div>

      <Button type="submit" className="w-full">
        Recover password
      </Button>

      <Button
        variant="link"
        className="w-full"
        size="xs"
        nativeButton={false}
        render={<Link href="/auth/sign-in" />}
      >
        Sign in instead
      </Button>
    </form>
  );
}

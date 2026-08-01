import { Slash } from 'lucide-react';
import Image from 'next/image';

import dragonLogo from '@/assets/dragon-logo.svg';
import { ablility } from '@/auth/auth';

import { OrganizationSwitcher } from './organization-switcher';
import { ProfileButton } from './profile-button';

export async function Header() {
  const permissions = await ablility();

  return (
    <div className="mx-auto flex max-w-300 items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src={dragonLogo} className="size-6 dark:invert" alt="logo" />

        <Slash className="text-border size-3 -rotate-24" />
        <OrganizationSwitcher />

        {permissions?.can('get', 'Project') && <p>Project</p>}
      </div>

      <div className="flex items-center gap-4">
        <ProfileButton />
      </div>
    </div>
  );
}

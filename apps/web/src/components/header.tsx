import { Slash } from 'lucide-react';
import Image from 'next/image';

import dragonLogo from '@/assets/dragon-logo.svg';

import { OrganizationSwitcher } from './organization-switcher';
import { ProfileButton } from './profile-button';

export function Header() {
  return (
    <div className="mx-auto flex max-w-300 items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src={dragonLogo} className="size-6 dark:invert" alt="logo" />

        <Slash className="text-border size-3 -rotate-24" />
        <OrganizationSwitcher />
      </div>

      <div className="flex items-center gap-4">
        <ProfileButton />
      </div>
    </div>
  );
}

import { Slash } from 'lucide-react';
import Image from 'next/image';

import dragonLogo from '@/assets/dragon-logo.svg';
import { ability } from '@/auth/auth';

import { OrganizationSwitcher } from './organization-switcher';
import { ProfileButton } from './profile-button';
import { ProjectSwitcher } from './project-switcher';
import { ThemeSwitcher } from './theme/theme-switcher';
import { Separator } from './ui/separator';

export async function Header() {
  const permissions = await ability();

  return (
    <div className="mx-auto mb-1 flex max-w-300 items-center justify-between border-b pb-1">
      <div className="flex items-center gap-3">
        <Image src={dragonLogo} className="size-6 dark:invert" alt="logo" />

        <Slash className="text-border size-3 -rotate-24" />
        <OrganizationSwitcher />

        {permissions?.can('get', 'Project') && (
          <>
            <Slash className="text-border size-3 -rotate-24" />
            <ProjectSwitcher />
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
        <Separator
          orientation="vertical"
          className="h-5 data-vertical:self-center"
        />
        <ProfileButton />
      </div>
    </div>
  );
}

import Image from 'next/image';

import dragonLogo from '@/assets/dragon-logo.svg';

import { ProfileButton } from './profile-button';

export function Header() {
  return (
    <div className="mx-auto flex max-w-300 items-center justify-between">
      <div className="flex items-center gap-3">
        <Image src={dragonLogo} className="size-6 dark:invert" alt="logo" />
      </div>

      <div className="flex items-center gap-4">
        <ProfileButton />
      </div>
    </div>
  );
}

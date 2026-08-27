import { Avatar, AvatarBadge, AvatarFallback } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';

const avatarColors = [
  'bg-sky-500/20 text-sky-700 dark:text-sky-300',
  'bg-violet-500/20 text-violet-700 dark:text-violet-300',
  'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  'bg-rose-500/20 text-rose-700 dark:text-rose-300',
];

function getAvatarColor(name: string): string {
  const charSum = name
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return avatarColors[charSum % avatarColors.length];
}

interface ContactAvatarProps {
  name: string;
  online?: boolean;
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function ContactAvatar({
  name,
  online = false,
  size = 'default',
  className,
}: ContactAvatarProps) {
  return (
    <Avatar size={size} className={cn('shrink-0', className)}>
      <AvatarFallback className={cn('font-medium', getAvatarColor(name))}>
        {getInitials(name)}
      </AvatarFallback>

      {online && <AvatarBadge className="ring-sidebar bg-emerald-500" />}
    </Avatar>
  );
}

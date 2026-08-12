'use client';

import { Role } from '@saas/auth';
import { ComponentProps } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { updateMemberAction } from './actions';

interface UpdateMemberRoleSelectProps extends ComponentProps<typeof Select> {
  memberId: string;
}

export function UpdateMemberRoleSelect({
  memberId,
  ...props
}: UpdateMemberRoleSelectProps) {
  async function updateMemberRole(role: Role) {
    await updateMemberAction(memberId, role);
  }

  return (
    <Select
      onValueChange={(value) => updateMemberRole(value as Role)}
      {...props}
    >
      <SelectTrigger className="w-26">
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="end">
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="MEMBER">Member</SelectItem>
        <SelectItem value="BILLING">Billing</SelectItem>
      </SelectContent>
    </Select>
  );
}

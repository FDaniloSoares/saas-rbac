import { organizationSchema } from '@saas/auth/src/models/organization';
import { ArrowLeftRight, Crown, Star } from 'lucide-react';
import Image from 'next/image';

import { ability, getCurrentOrg } from '@/auth/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { getMembers } from '@/http/get-members';
import { getMembership } from '@/http/get-membership';
import { getOrganization } from '@/http/get-organization';

export async function MemberList() {
  const currentOrg = await getCurrentOrg();
  const permissions = await ability();

  const [{ membership }, { members }, { organization }] = await Promise.all([
    getMembership(currentOrg!),
    getMembers(currentOrg!),
    getOrganization(currentOrg!),
  ]);

  const authOrganization = organizationSchema.parse(organization);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold">Members</h2>

      <div className="rounded border">
        <Table>
          <TableBody>
            {members.map((member) => {
              return (
                <TableRow key={member.id}>
                  <TableCell className="py-2.5" style={{ width: 48 }}>
                    <Avatar>
                      <AvatarFallback />
                      {member.avatarUrl && (
                        <Image
                          src={member.avatarUrl}
                          width={32}
                          height={32}
                          alt="imgj"
                          className="aspect-square size-full rounded-full"
                        />
                      )}
                    </Avatar>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-medium">
                        <span>{member.name}</span>
                        {member.userId === membership.userId && (
                          <Star className="text-muted-foreground size-3 shrink-0" />
                        )}
                        {member.userId === organization.ownerId && (
                          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                            <Crown className="size-3 shrink-0" />
                            Owner
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {member.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5">
                    <div className="flex items-center justify-end gap-2">
                      {permissions?.can(
                        'transfer_ownership',
                        authOrganization
                      ) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="border-border"
                        >
                          <ArrowLeftRight />
                          Tranfer ownership
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

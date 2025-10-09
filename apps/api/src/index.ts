import { defineAbilityFor } from '@saas/auth';

const ability = defineAbilityFor({ role: 'MEMBER'})

const userCanInviteSomeoneElse = ability.can('invite', 'User');
const userCanDeleteSomeoneElse = ability.can('delete', 'User');
const userCannotDeleteOtherUser = ability.cannot('delete', 'User');

console.log('invite: ', userCanInviteSomeoneElse);
console.log('delete: ', userCanDeleteSomeoneElse);
console.log('delete: ', userCannotDeleteOtherUser);

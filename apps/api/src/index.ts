import { defineAbilityFor } from '@saas/auth';
import { projectSchema } from '@saas/auth/src/models/project';

const ability = defineAbilityFor({ role: 'MEMBER', id: 'user-id' })
const project = projectSchema.parse({ id: 'project-id', ownerId: 'user-99id' })

console.log(ability.can('get', 'User'));
console.log(ability.can('delete', 'User'));

console.log(ability.can('delete', 'Project'));
console.log(ability.can('delete', project));

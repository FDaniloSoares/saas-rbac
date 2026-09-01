/* chave canônica do par: ordenar os ids garante que A→B e B→A
produzam a mesma conversa. o prefixo da org mantém o isolamento
multi-tenant — as mesmas duas pessoas em orgs diferentes conversam
em conversas diferentes */
export function getConversationId(
  organizationId: string,
  userA: string,
  userB: string
) {
  const [first, second] = [userA, userB].sort();

  return `${organizationId}:${first}:${second}`;
}

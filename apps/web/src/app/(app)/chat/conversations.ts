export interface Message {
  id: string;
  content: string;
  sentAt: string;
  fromMe: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  online: boolean;
  messages: Message[];
}

export const conversations: Conversation[] = [
  {
    id: '1',
    name: 'Ana Beatriz',
    lastMessage: 'Subi o deploy da staging',
    online: true,
    messages: [
      {
        id: '1',
        content: 'Bom dia! Conseguiu olhar o ticket do RBAC?',
        sentAt: '09:12',
        fromMe: false,
      },
      {
        id: '2',
        content: 'Olhei sim, faltava a permissão de billing',
        sentAt: '09:20',
        fromMe: true,
      },
      {
        id: '3',
        content: 'Subi o deploy da staging',
        sentAt: '09:41',
        fromMe: false,
      },
    ],
  },
  {
    id: '2',
    name: 'Carlos Menezes',
    lastMessage: 'Consegue revisar o PR?',
    online: true,
    messages: [
      {
        id: '1',
        content: 'Consegue revisar o PR?',
        sentAt: '14:03',
        fromMe: false,
      },
    ],
  },
  {
    id: '3',
    name: 'Duda Rocha',
    lastMessage: 'Fechado, valeu!',
    online: false,
    messages: [
      {
        id: '1',
        content: 'Te mandei o convite da organização',
        sentAt: '11:30',
        fromMe: true,
      },
      { id: '2', content: 'Fechado, valeu!', sentAt: '11:32', fromMe: false },
    ],
  },
  {
    id: '4',
    name: 'Rafael Lima',
    lastMessage: 'Te chamo depois do daily',
    online: false,
    messages: [
      {
        id: '1',
        content: 'Te chamo depois do daily',
        sentAt: '08:55',
        fromMe: false,
      },
    ],
  },
];

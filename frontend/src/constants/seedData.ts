import type { Data, User } from '../types/chat'

/** Live data is supplied by the community API. No sample users or content. */
export const me: User = {
  id: 'self',
  name: 'Your account',
  initials: 'YO',
  tone: 'self',
  status: 'idle',
}

export const people: User[] = []

export function roomKey(serverId: string, channelId: string): string {
  return `${serverId}:${channelId}`
}

export const defaultData: Data = {
  servers: [],
  channels: {},
  messages: {},
  dmMessages: {},
  conversations: [],
  displayName: '',
  theme: 'dark',
  pins: {},
}

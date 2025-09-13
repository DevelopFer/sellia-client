export interface User {
  id: string | number
  username: string
  name: string
  isOnline: boolean
  avatar?: string
}

export interface Message {
  id: string | number
  content: string
  senderId: string | number
  conversationId?: string
  createdAt?: Date | string
  timestamp?: Date | string // For backward compatibility
  sender?: {
    id: string
    name: string
  }
}

export interface Conversation {
  id: string
  title?: string
  isGroup: boolean
  createdAt: string
  updatedAt: string
  participants: ConversationParticipant[]
  messages?: Message[]
}

export interface ConversationParticipant {
  id: string
  userId: string
  conversationId: string
  joinedAt: string
  role: string
  user: {
    id: string
    username: string
    name?: string
  }
}

export interface CurrentUser {
  id: string | number
  name: string
  status: string
  avatar?: string
}
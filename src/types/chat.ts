export interface User {
  id: string | number
  name: string
  isOnline: boolean
  avatar?: string
}

export interface Message {
  id: string | number
  senderId: string | number
  recipientId: string | number
  content: string
  timestamp: Date
}

export interface CurrentUser {
  id: string | number
  name: string
  status: string
  avatar?: string
}
export interface User {
  id: number
  name: string
  isOnline: boolean
  avatar?: string
}

export interface Message {
  id: number
  senderId: number
  recipientId: number
  content: string
  timestamp: Date
}

export interface CurrentUser {
  id: number
  name: string
  status: string
  avatar?: string
}
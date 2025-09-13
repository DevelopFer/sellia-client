// API Response Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
  details?: any
}

// User API Types
export interface LoginRequest {
  username: string
}

export interface LoginResponse {
  user: {
    id: number
    name: string
    status: string
  }
  token?: string
}

export interface CreateUserRequest {
  username: string
  name?: string
}

export interface CreateUserResponse {
  id: string
  username: string
  name?: string
  createdAt: string
  updatedAt: string
}

export interface UsernameCheckResponse {
  taken: boolean
}

// Chat API Types
export interface SendMessageRequest {
  content: string
  recipientId: number
}

export interface MessageResponse {
  id: number
  senderId: number
  recipientId: number
  content: string
  timestamp: string
}

export interface UserResponse {
  id: number
  name: string
  isOnline: boolean
  avatar?: string
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  
  // Username
  CHECK_USERNAME: (username: string) => `/username/${username}/taken`,
  
  // Users
  USERS: '/users',
  LOGIN_OR_REGISTER: '/users/login-or-register',
  USER_STATUS: (userId: number) => `/users/${userId}/status`,
  
  // Messages
  MESSAGES: '/messages',
  USER_MESSAGES: (userId: number) => `/messages/user/${userId}`,
  SEND_MESSAGE: '/messages/send',
  
  // Conversations
  CONVERSATIONS: '/conversations',
  CONVERSATION: (conversationId: number) => `/conversations/${conversationId}`,
} as const
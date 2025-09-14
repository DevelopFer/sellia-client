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
  senderId: string
  conversationId: string
  messageType?: string
}

export interface MessageResponse {
  id: string
  content: string
  messageType: string
  senderId: string
  conversationId: string
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    username: string
    name?: string
  }
}

export interface UserResponse {
  id: number
  name: string
  isOnline: boolean
  isBot?: boolean
  avatar?: string
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

export interface ConversationResponse {
  id: string
  title?: string
  isGroup: boolean
  createdAt: string
  updatedAt: string
  participants: ConversationParticipant[]
  messages: MessageResponse[]
}

export interface FindOrCreateConversationRequest {
  currentUserId: string
  otherUserId: string
}

export interface CreateConversationRequest {
  participantIds: string[]
  title?: string
  isGroup?: boolean
}

// Search API Types
export interface SearchMessageResult {
  id: string
  content: string
  highlightedContent: string
  createdAt: string
  sender: {
    id: string
    username: string
    name?: string
  }
  conversation: {
    id: string
    title?: string
    isGroup: boolean
    participants: Array<{
      id: string
      username: string
      name?: string
    }>
  }
}

export interface SearchMessagesResponse {
  results: SearchMessageResult[]
  query: string
  total: number
}

export interface UserResponse {
  id: number
  username: string
  name: string
  isOnline: boolean
  isBot?: boolean
  avatar?: string
}

export interface PaginatedUsersResponse {
  users: UserResponse[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
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
  USER_MESSAGES: (userId: string) => `/messages/user/${userId}`,
  CONVERSATION_MESSAGES: (conversationId: string) => `/messages/conversation/${conversationId}`,
  SEND_MESSAGE: '/messages/send',
  SEARCH_MESSAGES: (query: string) => `/messages/search/${encodeURIComponent(query)}`,
  
  // Conversations
  CONVERSATIONS: '/conversations',
  CONVERSATION: (conversationId: string) => `/conversations/${conversationId}`,
  USER_CONVERSATIONS: (userId: string) => `/conversations/user/${userId}`,
  FIND_OR_CREATE_CONVERSATION: '/conversations/find-or-create',
} as const
import { api } from './client'
import { API_ENDPOINTS } from '@/types/api'
import type { 
  SendMessageRequest, 
  MessageResponse, 
  ConversationResponse, 
  FindOrCreateConversationRequest, 
  CreateConversationRequest,
  SearchMessageResult
} from '@/types/api'

// Messages API calls
export const messagesApi = {
  getUserMessages: async (userId: string): Promise<MessageResponse[]> => {
    return api.get(API_ENDPOINTS.USER_MESSAGES(userId))
  },

  getConversationMessages: async (conversationId: string): Promise<MessageResponse[]> => {
    return api.get(API_ENDPOINTS.CONVERSATION_MESSAGES(conversationId))
  },

  sendMessage: async (data: SendMessageRequest): Promise<MessageResponse> => {
    return api.post(API_ENDPOINTS.SEND_MESSAGE, data)
  },

  getAllMessages: async (): Promise<MessageResponse[]> => {
    return api.get(API_ENDPOINTS.MESSAGES)
  },

  searchMessages: async (query: string): Promise<SearchMessageResult[]> => {
    if (!query || query.trim().length < 2) {
      return []
    }
    return api.get(API_ENDPOINTS.SEARCH_MESSAGES(query.trim()))
  },
}

// Conversations API calls
export const conversationsApi = {
  getConversations: async (): Promise<ConversationResponse[]> => {
    return api.get(API_ENDPOINTS.CONVERSATIONS)
  },

  getConversation: async (conversationId: string): Promise<ConversationResponse> => {
    return api.get(API_ENDPOINTS.CONVERSATION(conversationId))
  },

  getUserConversations: async (userId: string): Promise<ConversationResponse[]> => {
    return api.get(API_ENDPOINTS.USER_CONVERSATIONS(userId))
  },

  findOrCreateConversation: async (data: FindOrCreateConversationRequest): Promise<ConversationResponse> => {
    return api.post(API_ENDPOINTS.FIND_OR_CREATE_CONVERSATION, data)
  },

  createConversation: async (data: CreateConversationRequest): Promise<ConversationResponse> => {
    return api.post(API_ENDPOINTS.CONVERSATIONS, data)
  },
}
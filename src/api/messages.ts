import { api } from './client'
import { API_ENDPOINTS } from '@/types/api'
import type { SendMessageRequest, MessageResponse } from '@/types/api'

// Messages API calls
export const messagesApi = {
  getUserMessages: async (userId: number): Promise<MessageResponse[]> => {
    const response = await api.get<MessageResponse[]>(API_ENDPOINTS.USER_MESSAGES(userId))
    return response.data
  },

  sendMessage: async (data: SendMessageRequest): Promise<MessageResponse> => {
    const response = await api.post<MessageResponse>(API_ENDPOINTS.SEND_MESSAGE, data)
    return response.data
  },

  getAllMessages: async (): Promise<MessageResponse[]> => {
    const response = await api.get<MessageResponse[]>(API_ENDPOINTS.MESSAGES)
    return response.data
  },
}

// Conversations API calls
export const conversationsApi = {
  getConversations: async (): Promise<any[]> => {
    const response = await api.get<any[]>(API_ENDPOINTS.CONVERSATIONS)
    return response.data
  },

  getConversation: async (conversationId: number): Promise<any> => {
    const response = await api.get<any>(API_ENDPOINTS.CONVERSATION(conversationId))
    return response.data
  },
}
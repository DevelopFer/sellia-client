import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, CurrentUser, Conversation } from '@/types/chat'
import { usersApi, conversationsApi, messagesApi } from '@/api'

export const useUsersStore = defineStore('users', () => {
  // State
  const currentUser = ref<CurrentUser | null>(null)
  
  const users = ref<User[]>([])
  
  // Pagination state
  const currentPage = ref(1)
  const pageLimit = ref(10) // Default to 10 users per page
  const totalUsers = ref(0)
  const totalPages = ref(0)
  const hasNextPage = ref(false)
  const hasPrevPage = ref(false)
  const isLoadingUsers = ref(false)
  
  // Conversation and messages state
  const currentConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const isLoadingConversation = ref(false)
  const isLoadingMessages = ref(false)
  
  const selectedUserId = ref<string | number | null>(null)

  // Getters
  const selectedUser = computed(() => {
    return users.value.find((user: User) => user.id === selectedUserId.value)
  })
  
  const currentMessages = computed(() => {
    return messages.value
  })
  
  const onlineUsersCount = computed(() => {
    return users.value.filter((user: User) => user.isOnline).length
  })

  // Actions
  const selectUser = async (userId: string | number) => {
    if (!currentUser.value) {
      console.error('No current user set')
      return
    }

    try {
      selectedUserId.value = userId
      isLoadingConversation.value = true
      isLoadingMessages.value = true
      
      // Convert IDs to strings for API calls
      const currentUserIdStr = String(currentUser.value.id)
      const otherUserIdStr = String(userId)
      
      // Find or create conversation between current user and selected user
      const conversation = await conversationsApi.findOrCreateConversation({
        currentUserId: currentUserIdStr,
        otherUserId: otherUserIdStr
      })
      
      currentConversation.value = conversation as Conversation
      
      // Load messages for this conversation
      const conversationMessages = await messagesApi.getConversationMessages(conversation.id)
      
      // Transform API messages to match our Message interface
      messages.value = conversationMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.senderId,
        conversationId: msg.conversationId,
        createdAt: msg.createdAt,
        timestamp: new Date(msg.createdAt),
        sender: {
          id: msg.sender.id,
          name: msg.sender.name || msg.sender.username // Fallback to username if name is undefined
        }
      }))
      
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      isLoadingConversation.value = false
      isLoadingMessages.value = false
    }
  }
  
  const clearSelectedUser = () => {
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
  }
  
  const setCurrentUser = (user: CurrentUser) => {
    currentUser.value = user
  }
  
  const logout = () => {
    currentUser.value = null
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
  }
  
  // Computed properties
  const isAuthenticated = computed(() => currentUser.value !== null)
  
  const addMessage = async (content: string) => {
    if (!content.trim() || !currentConversation.value || !currentUser.value) return
    
    try {
      const newMessage = await messagesApi.sendMessage({
        content: content.trim(),
        senderId: String(currentUser.value.id),
        conversationId: currentConversation.value.id,
        messageType: 'text'
      })
      
      // Add the new message to our local state
      messages.value.push({
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        conversationId: newMessage.conversationId,
        createdAt: newMessage.createdAt,
        timestamp: new Date(newMessage.createdAt),
        sender: {
          id: newMessage.sender.id,
          name: newMessage.sender.name || newMessage.sender.username
        }
      })
      
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }
  
  const updateUserStatus = (userId: string | number, isOnline: boolean) => {
    const user = users.value.find((u: User) => u.id === userId)
    if (user) {
      user.isOnline = isOnline
    }
  }
  
  const addUser = (user: User) => {
    users.value.push(user)
  }
  
  const removeUser = (userId: string | number) => {
    const index = users.value.findIndex((u: User) => u.id === userId)
    if (index > -1) {
      users.value.splice(index, 1)
      if (selectedUserId.value === userId) {
        selectedUserId.value = null
      }
    }
  }

  // Pagination actions
  const loadUsers = async (page: number = 1) => {
    try {
      isLoadingUsers.value = true
      const response = await usersApi.getUsersPaginated(page, pageLimit.value)
      
      // Replace users array with new page data, excluding current user
      users.value = response.users
        .filter(user => currentUser.value && String(user.id) !== String(currentUser.value.id))
        .map(user => ({
          id: user.id,
          username: user.username,
          name: user.name,
          isOnline: user.isOnline || false,
          avatar: user.avatar
        }))
      
      // Update pagination state
      currentPage.value = response.pagination.page
      totalUsers.value = response.pagination.total
      totalPages.value = response.pagination.totalPages
      hasNextPage.value = response.pagination.hasNext
      hasPrevPage.value = response.pagination.hasPrev
      
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      isLoadingUsers.value = false
    }
  }
  
  const loadNextPage = async () => {
    if (hasNextPage.value && !isLoadingUsers.value) {
      await loadUsers(currentPage.value + 1)
    }
  }
  
  const loadPrevPage = async () => {
    if (hasPrevPage.value && !isLoadingUsers.value) {
      await loadUsers(currentPage.value - 1)
    }
  }
  
  const loadSpecificPage = async (page: number) => {
    if (page >= 1 && page <= totalPages.value && !isLoadingUsers.value) {
      await loadUsers(page)
    }
  }

  return {
    // State
    currentUser,
    users,
    messages,
    selectedUserId,
    currentConversation,
    // Pagination state
    currentPage,
    pageLimit,
    totalUsers,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoadingUsers,
    isLoadingConversation,
    isLoadingMessages,
    // Getters
    selectedUser,
    currentMessages,
    onlineUsersCount,
    isAuthenticated,
    // Actions
    selectUser,
    clearSelectedUser,
    setCurrentUser,
    logout,
    addMessage,
    updateUserStatus,
    addUser,
    removeUser,
    // Pagination actions
    loadUsers,
    loadNextPage,
    loadPrevPage,
    loadSpecificPage
  }
})
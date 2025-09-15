import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, CurrentUser, Conversation } from '@/types/chat'
import { usersApi, conversationsApi, messagesApi } from '@/api'
import { useSocket, type UserStatusEvent } from '@/composables/useSocket'

// LocalStorage utilities for user persistence
const CURRENT_USER_KEY = 'sellia_current_user'

const saveCurrentUserToStorage = (user: CurrentUser | null) => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  } catch (error) {
    console.warn('Failed to save user to localStorage:', error)
  }
}

const loadCurrentUserFromStorage = (): CurrentUser | null => {
  try {
    const stored = localStorage.getItem(CURRENT_USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.warn('Failed to load user from localStorage:', error)
    return null
  }
}

export const useUsersStore = defineStore('users', () => {
  // State - Initialize currentUser from localStorage
  const currentUser = ref<CurrentUser | null>(loadCurrentUserFromStorage())
  
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

  // Socket integration
  const socket = useSocket()

  // Track if socket is already initialized to prevent duplicate connections
  const isSocketInitialized = ref(false)

  // Initialize socket connection and event listeners
  const initializeSocket = () => {
    if (isSocketInitialized.value) {
      console.log('Socket already initialized, skipping...')
      return
    }

    console.log('Initializing socket connection...')
    socket.connect()
    isSocketInitialized.value = true
    
    // Listen for user status changes
    socket.on('user:status_changed', (data: UserStatusEvent) => {
      console.log('User status changed:', data)
      const user = users.value.find(u => String(u.id) === String(data.userId))
      if (user) {
        user.isOnline = data.isOnline
        console.log(`Updated user ${user.name} status to ${data.isOnline ? 'online' : 'offline'}`)
      } else {
        console.log('User not found in current users list:', data.userId)
      }
    })

    // Listen for socket connection confirmation
    socket.on('user:online_confirmed', (data: { userId: string; isOnline: boolean }) => {
      console.log('User online status confirmed:', data)
    })

    socket.on('user:offline_confirmed', (data: { userId: string; isOnline: boolean }) => {
      console.log('User offline status confirmed:', data)
    })

    // Listen for socket errors
    socket.on('user:error', (error: { message: string }) => {
      console.error('Socket user error:', error.message)
    })

    // Listen for new message events
    socket.onNewMessage((event) => {
      console.log('New message received:', event)
      
      // If this is a message from another user
      if (currentUser.value && String(event.message.senderId) !== String(currentUser.value.id)) {
        const messageFromUserId = event.message.senderId
        const messageConversationId = event.conversationId
        
        // Check if this message is from the currently active conversation
        const isActiveConversation = currentConversation.value && 
          String(currentConversation.value.id) === String(messageConversationId)
        
        if (isActiveConversation) {
          // Add message to current conversation messages
          messages.value.push({
            id: event.message.id,
            content: event.message.content,
            senderId: event.message.senderId,
            conversationId: event.message.conversationId,
            createdAt: event.message.createdAt,
            timestamp: new Date(event.message.createdAt),
            sender: event.message.sender
          })
        } else {
          // Increment unread count for the user who sent the message
          incrementUnreadCount(messageFromUserId)
        }
      }
    })

    // Listen for socket connection events
    socket.on('connect', () => {
      console.log('Socket connected successfully')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // Listen for conversation join/leave confirmations
    socket.on('conversation:joined', (data: { conversationId: string; roomInfo?: any }) => {
      console.log('✅ Successfully joined conversation:', data.conversationId, 'Room info:', data.roomInfo)
    })

    socket.on('conversation:error', (error: { message: string }) => {
      console.error('❌ Conversation error:', error.message)
    })

    socket.on('conversation:user_joined', (data: { conversationId: string; userId: string }) => {
      console.log('👤 User joined conversation:', data)
    })

    socket.on('conversation:user_left', (data: { conversationId: string; userId: string }) => {
      console.log('👤 User left conversation:', data)
    })
  }

  // Cleanup socket connection
  const cleanupSocket = () => {
    if (currentUser.value) {
      socket.setUserOffline(String(currentUser.value.id))
    }
    socket.disconnect()
    isSocketInitialized.value = false
  }

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
      // Leave previous conversation if any
      if (currentConversation.value) {
        socket.leaveConversation(currentConversation.value.id, String(currentUser.value.id))
      }

      selectedUserId.value = userId
      isLoadingConversation.value = true
      isLoadingMessages.value = true
      
      // Reset unread count for this user since we're viewing their conversation
      resetUnreadCount(userId)
      
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
      
      // Join the conversation room for real-time message notifications
      socket.joinConversation(conversation.id, currentUserIdStr)
      
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      isLoadingConversation.value = false
      isLoadingMessages.value = false
    }
  }
  
  const clearSelectedUser = () => {
    // Leave current conversation if any
    if (currentConversation.value && currentUser.value) {
      socket.leaveConversation(currentConversation.value.id, String(currentUser.value.id))
    }
    
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
  }
  
  const setCurrentUser = (user: CurrentUser) => {
    currentUser.value = user
    
    // Persist user to localStorage
    saveCurrentUserToStorage(user)
    
    // Initialize socket connection only if not already initialized
    if (!isSocketInitialized.value) {
      initializeSocket()
    }
    
    // Set user as online via socket - wait a bit for connection to establish
    setTimeout(() => {
      console.log('Setting user online:', user.id)
      socket.setUserOnline(String(user.id))
    }, 500)
  }
  
  const logout = () => {
    // Set user offline before clearing data
    if (currentUser.value) {
      socket.setUserOffline(String(currentUser.value.id))
    }
    
    cleanupSocket()
    currentUser.value = null
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
    
    // Clear user from localStorage
    saveCurrentUserToStorage(null)
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

  // Unread message tracking
  const incrementUnreadCount = (userId: string | number) => {
    const user = users.value.find((u: User) => String(u.id) === String(userId))
    if (user) {
      user.unreadCount = (user.unreadCount || 0) + 1
    }
  }

  const resetUnreadCount = (userId: string | number) => {
    const user = users.value.find((u: User) => String(u.id) === String(userId))
    if (user) {
      user.unreadCount = 0
    }
  }

  const getUnreadCount = (userId: string | number): number => {
    const user = users.value.find((u: User) => String(u.id) === String(userId))
    return user?.unreadCount || 0
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
          avatar: user.avatar,
          unreadCount: 0 // Initialize unread count to 0
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
    // Socket state
    isSocketInitialized,
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
    // Unread message actions
    incrementUnreadCount,
    resetUnreadCount,
    getUnreadCount,
    // Pagination actions
    loadUsers,
    loadNextPage,
    loadPrevPage,
    loadSpecificPage,
    // Socket actions
    initializeSocket,
    cleanupSocket
  }
  
  // Auto-initialize socket if user is already logged in from localStorage
  const storeInstance = {
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
    // Socket state
    isSocketInitialized,
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
    // Unread message actions
    incrementUnreadCount,
    resetUnreadCount,
    getUnreadCount,
    // Pagination actions
    loadUsers,
    loadNextPage,
    loadPrevPage,
    loadSpecificPage,
    // Socket actions
    initializeSocket,
    cleanupSocket
  }
  
  // Auto-initialize socket if user is already logged in from localStorage
  if (currentUser.value && !isSocketInitialized.value) {
    console.log('Auto-initializing socket for persisted user:', currentUser.value?.name)
    initializeSocket()
    
    // Set user as online via socket - wait a bit for connection to establish
    setTimeout(() => {
      console.log('Setting persisted user online:', currentUser.value?.id)
      if (currentUser.value) {
        socket.setUserOnline(String(currentUser.value.id))
      }
    }, 500)
  }
  
  return storeInstance
})
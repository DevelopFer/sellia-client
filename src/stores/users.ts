import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, CurrentUser, Conversation } from '@/types/chat'
import { usersApi, conversationsApi, messagesApi } from '@/api'
import { useSocket, type UserStatusEvent } from '@/composables/useSocket'

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
  
  /**Pagination */
  const currentPage = ref(1)
  const pageLimit = ref(10) // Default to 10 users per page
  const totalUsers = ref(0)
  const totalPages = ref(0)
  const hasNextPage = ref(false)
  const hasPrevPage = ref(false)
  const isLoadingUsers = ref(false)
  
  /* Current conversation and messages */
  const currentConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const isLoadingConversation = ref(false)
  const isLoadingMessages = ref(false)
  
  const selectedUserId = ref<string | number | null>(null)

  /* Socket */
  const socket = useSocket()

  
  const isSocketInitialized = ref(false)

  
  const initializeSocket = () => {
    if (isSocketInitialized.value) {
      console.log('Socket already initialized, skipping...')
      return
    }

    console.log('Initializing socket connection...')
    socket.connect()
    isSocketInitialized.value = true
    
  
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

  
    socket.on('user:online_confirmed', (data: { userId: string; isOnline: boolean }) => {
      console.log('User online status confirmed:', data)
    })

    socket.on('user:offline_confirmed', (data: { userId: string; isOnline: boolean }) => {
      console.log('User offline status confirmed:', data)
    })

  
    socket.on('user:error', (error: { message: string }) => {
      console.error('Socket user error:', error.message)
    })

  
    socket.onNewMessage((event) => {
      console.log('New message received:', event)
      
  
      if (currentUser.value && String(event.message.senderId) !== String(currentUser.value.id)) {
        const messageFromUserId = event.message.senderId
        const messageConversationId = event.conversationId
        
  
        const isActiveConversation = currentConversation.value && 
          String(currentConversation.value.id) === String(messageConversationId)
        
        if (isActiveConversation) {
  
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
  
          incrementUnreadCount(messageFromUserId)
        }
      }
    })

  
    socket.on('connect', () => {
      console.log('Socket connected successfully')
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

  
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

  
  const cleanupSocket = () => {
    if (currentUser.value && socket.isConnected.value) {
      socket.setUserOffline(String(currentUser.value.id)).catch((error) => {
        console.warn('Failed to set user offline during cleanup:', error)
      })
    }
    socket.disconnect()
    isSocketInitialized.value = false
  }




  /** GETTERS */
  const selectedUser = computed(() => {
    return users.value.find((user: User) => user.id === selectedUserId.value)
  })
  
  const currentMessages = computed(() => {
    return messages.value
  })
  
  const onlineUsersCount = computed(() => {
    return users.value.filter((user: User) => user.isOnline).length
  })




  /** ACTIONS */
  const selectUser = async (userId: string | number) => {
    if (!currentUser.value) {
      console.error('No current user set')
      return
    }

    // Ensure socket is initialized before conversation operations
    if (!isSocketInitialized.value) {
      console.log('Socket not initialized, initializing now...')
      initializeSocket()
    }

    // Wait for socket connection before proceeding
    const isConnected = await socket.waitForConnection(5000)
    if (!isConnected) {
      console.error('Socket connection timeout, cannot join conversation')
      return
    }

    try {
      
      selectedUserId.value = userId
      isLoadingConversation.value = true
      isLoadingMessages.value = true
      
      
      resetUnreadCount(userId)
      
      
      const currentUserIdStr = String(currentUser.value.id)
      const otherUserIdStr = String(userId)
      
      
      const conversation = await conversationsApi.findOrCreateConversation({
        currentUserId: currentUserIdStr,
        otherUserId: otherUserIdStr
      })
      
      currentConversation.value = conversation as Conversation
      
      const conversationMessages = await messagesApi.getConversationMessages(conversation.id)
      
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
      

      socket.joinConversation(conversation.id, currentUserIdStr).catch((error) => {
        console.error('Failed to join conversation room:', error)
      })
      
    } catch (error) {
      console.error('Failed to load conversation:', error)
    } finally {
      isLoadingConversation.value = false
      isLoadingMessages.value = false
    }
  }
  
  const clearSelectedUser = () => {
    if (currentConversation.value && currentUser.value) {
      socket.leaveConversation(currentConversation.value.id, String(currentUser.value.id))
    }
    
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
  }

  const joinAllUserConversations = async () => {
    if (!currentUser.value) {
      console.warn('No current user, cannot join conversations')
      return
    }

    // Ensure socket is initialized and connected
    if (!isSocketInitialized.value) {
      console.log('Socket not initialized for joining conversations, skipping...')
      return
    }

    // Wait for socket connection
    const isConnected = await socket.waitForConnection(5000)
    if (!isConnected) {
      console.warn('Socket connection timeout, cannot join conversations')
      return
    }

    try {
      console.log('Joining all user conversations for background notifications...')
      const userConversations = await conversationsApi.getUserConversations(String(currentUser.value.id))
      
      for (const conversation of userConversations) {
        try {
          await socket.joinConversation(conversation.id, String(currentUser.value.id))
          console.log(`📢 Joined conversation room: ${conversation.id}`)
        } catch (error) {
          console.warn(`Failed to join conversation ${conversation.id}:`, error)
        }
      }
      
      console.log(`✅ Joined ${userConversations.length} conversation rooms for notifications`)
    } catch (error) {
      console.error('Failed to join user conversations:', error)
    }
  }

  const setCurrentUser = (user: CurrentUser) => {
    currentUser.value = user
    
    saveCurrentUserToStorage(user)
    
    if (!isSocketInitialized.value) {
      initializeSocket()
    }
    
    setTimeout(() => {
      console.log('Setting user online:', user.id)
      socket.setUserOnline(String(user.id)).catch((error) => {
        console.error('Failed to set user online:', error)
      })
      
      joinAllUserConversations()
    }, 500)
  }
  
  const logout = () => {
    if (currentUser.value && socket.isConnected.value) {
      socket.setUserOffline(String(currentUser.value.id)).catch((error) => {
        console.warn('Failed to set user offline during logout:', error)
      })
    }
    
    socket.disconnect()
    isSocketInitialized.value = false
    currentUser.value = null
    selectedUserId.value = null
    currentConversation.value = null
    messages.value = []
    
    saveCurrentUserToStorage(null)
  }
  
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

  const loadUsers = async (page: number = 1) => {
    try {
      isLoadingUsers.value = true
      const response = await usersApi.getUsersPaginated(page, pageLimit.value)
      
      users.value = response.users
        .filter(user => currentUser.value && String(user.id) !== String(currentUser.value.id))
        .map(user => ({
          id: user.id,
          username: user.username,
          name: user.name,
          isOnline: user.isOnline || false,
          avatar: user.avatar,
          unreadCount: 0
        }))
      
      
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
    
    currentUser,
    users,
    messages,
    selectedUserId,
    currentConversation,
    
    
    currentPage,
    pageLimit,
    totalUsers,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isLoadingUsers,
    isLoadingConversation,
    isLoadingMessages,
    
    
    isSocketInitialized,
    
    
    selectedUser,
    currentMessages,
    onlineUsersCount,
    isAuthenticated,
    

    selectUser,
    clearSelectedUser,
    setCurrentUser,
    logout,
    addMessage,
    updateUserStatus,
    addUser,
    removeUser,
    

    incrementUnreadCount,
    resetUnreadCount,
    getUnreadCount,
    
    
    loadUsers,
    loadNextPage,
    loadPrevPage,
    loadSpecificPage,
    
    
    initializeSocket,
    cleanupSocket
  }
  
  // // Auto-initialize socket if user is already logged in from localStorage
  // const storeInstance = {
  //   // State
  //   currentUser,
  //   users,
  //   messages,
  //   selectedUserId,
  //   currentConversation,
  //   // Pagination state
  //   currentPage,
  //   pageLimit,
  //   totalUsers,
  //   totalPages,
  //   hasNextPage,
  //   hasPrevPage,
  //   isLoadingUsers,
  //   isLoadingConversation,
  //   isLoadingMessages,
  //   // Socket state
  //   isSocketInitialized,
  //   // Getters
  //   selectedUser,
  //   currentMessages,
  //   onlineUsersCount,
  //   isAuthenticated,
  //   // Actions
  //   selectUser,
  //   clearSelectedUser,
  //   setCurrentUser,
  //   logout,
  //   addMessage,
  //   updateUserStatus,
  //   addUser,
  //   removeUser,
  //   // Unread message actions
  //   incrementUnreadCount,
  //   resetUnreadCount,
  //   getUnreadCount,
  //   // Pagination actions
  //   loadUsers,
  //   loadNextPage,
  //   loadPrevPage,
  //   loadSpecificPage,
  //   // Socket actions
  //   initializeSocket,
  //   cleanupSocket,
  //   joinAllUserConversations
  // }
  
  // // Auto-initialize socket if user is already logged in from localStorage
  // if (currentUser.value && !isSocketInitialized.value) {
  //   console.log('Auto-initializing socket for persisted user:', currentUser.value?.name)
  //   initializeSocket()
    
  //   // Set user as online via socket - wait a bit for connection to establish
  //   setTimeout(() => {
  //     console.log('Setting persisted user online:', currentUser.value?.id)
  //     if (currentUser.value) {
  //       socket.setUserOnline(String(currentUser.value.id)).catch((error) => {
  //         console.error('Failed to set persisted user online:', error)
  //       })
        
  //       // Join all user conversations for background notifications
  //       joinAllUserConversations()
  //     }
  //   }, 500)
  // }
  
  // return storeInstance
})
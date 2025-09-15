import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, CurrentUser, Conversation } from '@/types/chat'
import { usersApi, conversationsApi, messagesApi } from '@/api'
import { useSocket } from '@/composables/useSocket'
import type { UserStatusEvent } from '@/composables/useSocket'

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
  
  const currentUser = ref<CurrentUser | null>(loadCurrentUserFromStorage())
  
  const users = ref<User[]>([])
  
  const currentPage = ref(1)
  const pageLimit = ref(10)
  const totalUsers = ref(0)
  const totalPages = ref(0)
  const hasNextPage = ref(false)
  const hasPrevPage = ref(false)
  const isLoadingUsers = ref(false)
  
  const currentConversation = ref<Conversation | null>(null)
  const messages = ref<Message[]>([])
  const isLoadingConversation = ref(false)
  const isLoadingMessages = ref(false)
  const isSendingMessage = ref(false)
  
  const selectedUserId = ref<string | number | null>(null)

  const socket = useSocket()

  const isSocketInitialized = ref(false)
  const pendingOnlineUserIds = ref<string[]>([])

  /** Helper function to request online status with retry logic */
  const requestOnlineStatus = (reason: string = 'manual') => {
    if (!isSocketInitialized.value) {
      console.log(`⏳ Socket not initialized yet, cannot request online status (${reason})`)
      return
    }

    if (!socket.isConnected.value) {
      console.log(`⏳ Socket not connected yet, retrying online status request in 1s (${reason})`)
      setTimeout(() => requestOnlineStatus(`${reason}-retry`), 1000)
      return
    }

    console.log(`🔄 Requesting online status: ${reason}`)
    socket.emit('request:online_users', {})
  }

  /** Helper function to apply online status to users */
  const applyOnlineStatus = (onlineUserIds: string[]) => {
    let updatedCount = 0
    users.value.forEach(user => {
      
      /* Bot users - they should always remain online */
      if (user.isBot) {
        return
      }
      
      const isCurrentlyOnline = onlineUserIds.includes(String(user.id))
      if (user.isOnline !== isCurrentlyOnline) {
        console.log(`🔄 Updating ${user.name} status: ${user.isOnline ? 'online' : 'offline'} → ${isCurrentlyOnline ? 'online' : 'offline'}`)
        user.isOnline = isCurrentlyOnline
        updatedCount++
      }
    })
    console.log(`✅ Applied online status to ${updatedCount} users (skipped bots)`)
  }

  
  const initializeSocket = () => {
    if (isSocketInitialized.value) {
      console.log('Socket already initialized, skipping...')
      return
    }

    console.log('Initializing socket connection...')
    socket.connect()
    isSocketInitialized.value = true
    
    
    const syncInterval = setInterval(() => {
      if (socket.isConnected.value && users.value.length > 0) {
        requestOnlineStatus('periodic-sync')
      }
    }, 30000)
    
    
    const originalCleanup = socket.disconnect
    socket.disconnect = () => {
      clearInterval(syncInterval)
      originalCleanup.call(socket)
    }
    
  
    socket.on('user:status_changed', (data: UserStatusEvent) => {
      console.log('User status changed:', data)
      const user = users.value.find(u => String(u.id) === String(data.userId))
      if (user) {
    
        if (user.isBot) {
          console.log(`Skipping status update for bot user: ${user.name}`)
          return
        }
        
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
      console.log('🔔 New message received via socket:', event)
      console.log('🔍 Event details:', {
        conversationId: event.conversationId,
        messageId: event.message?.id,
        senderId: event.message?.senderId,
        senderName: event.message?.sender?.name,
        content: event.message?.content,
        timestamp: event.timestamp
      })
      
      if (!currentUser.value) {
        console.warn('❌ No current user, ignoring message')
        return
      }
      
      const messageFromUserId = event.message.senderId
      const messageConversationId = event.conversationId
      const isFromCurrentUser = String(event.message.senderId) === String(currentUser.value.id)
      
      console.log('🔍 Message analysis:', {
        messageFromUserId,
        messageConversationId,
        isFromCurrentUser,
        currentConversationId: currentConversation.value?.id,
        hasActiveConversation: !!currentConversation.value
      })
      
      const isActiveConversation = currentConversation.value && 
        String(currentConversation.value.id) === String(messageConversationId)
      
      console.log('🎯 Is active conversation:', isActiveConversation)
      
      if (isActiveConversation) {
        console.log('✅ Adding message to active conversation')
        
        messages.value.push({
          id: event.message.id,
          content: event.message.content,
          senderId: event.message.senderId,
          conversationId: event.message.conversationId,
          createdAt: event.message.createdAt,
          timestamp: new Date(event.message.createdAt),
          sender: event.message.sender
        })
        
        console.log('📝 Message added, total messages now:', messages.value.length)
      } else if (!isFromCurrentUser) {
        console.log('📬 Message for different conversation, incrementing unread count')
        incrementUnreadCount(messageFromUserId)
      } else {
        console.log('🔕 Message ignored - not for active conversation and is from current user')
      }
    })

  
    socket.on('connect', () => {
      console.log('Socket connected successfully')
      
    
      if (currentUser.value) {
        console.log('Setting current user online after reconnection:', currentUser.value.id)
        socket.setUserOnline(String(currentUser.value.id)).catch((error) => {
          console.error('Failed to set user online after reconnection:', error)
        })
      }

      /* Always request current online users after connection */
      setTimeout(() => {
        requestOnlineStatus('socket-connected')
      }, 500)

      /* If users are already loaded, request status again after a longer delay */
      if (users.value.length > 0) {
        setTimeout(() => {
          requestOnlineStatus('socket-connected-users-loaded')
        }, 1500)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    
    socket.on('online_users:current', (data: { userIds: string[]; timestamp: string }) => {
      console.log('📡 Received current online users:', data.userIds)
      
    
      pendingOnlineUserIds.value = data.userIds
      
    
      if (users.value.length > 0) {
        applyOnlineStatus(data.userIds)
      } else {
        console.log('� Users not loaded yet, storing online status for later application')
      }
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


    socket.on('user:joined', (data: { user: User; timestamp: string }) => {
      console.log('🎉 New user joined:', data.user)
      

      const existingUser = users.value.find(u => String(u.id) === String(data.user.id))
      if (!existingUser) {
        users.value.unshift(data.user) // Add to the beginning of the list
        console.log('✅ Added new user to the list:', data.user.username)
      }
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

    
    if (!isSocketInitialized.value) {
      console.log('Socket not initialized, initializing now...')
      initializeSocket()
    }

    const isConnected = await socket.waitForConnection(10000)
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
          name: msg.sender.name || msg.sender.username
        }
      }))

      await socket.joinConversation(conversation.id, currentUserIdStr)
      console.log(`✅ Successfully joined conversation room: ${conversation.id}`)
      
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

    
    if (!isSocketInitialized.value) {
      console.log('Socket not initialized for joining conversations, skipping...')
      return
    }

    
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

    /* Wait for socket connection and then set user online */
    setTimeout(async () => {
      try {
        if (!socket.isConnected.value) {
          console.log('Socket not connected, waiting for connection...')
          const connected = await socket.waitForConnection(10000)
          if (!connected) {
            console.error('Socket connection timeout')
            return
          }
        }
        
        console.log('Setting user online:', user.id)
        await socket.setUserOnline(String(user.id))
        
        setTimeout(() => {
          requestOnlineStatus('user-login')
        }, 500)
        
        await joinAllUserConversations()
      } catch (error) {
        console.error('Failed to set user online:', error)
      }
    }, 1000)
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
    
    isSendingMessage.value = true
    try {
      await messagesApi.sendMessage({
        content: content.trim(),
        senderId: String(currentUser.value.id),
        conversationId: currentConversation.value.id,
        messageType: 'text'
      })
      
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      isSendingMessage.value = false
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
          isOnline: user.isBot ? true : (user.isOnline || false), // Bots are always online
          avatar: user.avatar,
          unreadCount: 0,
          isBot: user.isBot || false
        }))
      
      
      if (pendingOnlineUserIds.value.length > 0) {
        console.log('📡 Applying pending online status to loaded users')
        applyOnlineStatus(pendingOnlineUserIds.value)
        pendingOnlineUserIds.value = [] // Clear pending status
      }
      
      
      setTimeout(() => {
        requestOnlineStatus('users-loaded')
      }, 300)
      
      
      setTimeout(() => {
        requestOnlineStatus('users-loaded-delayed')
      }, 2000)
      
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

  if (currentUser.value && !isSocketInitialized.value) {
    console.log('Auto-initializing socket for existing user session...')
    setTimeout(() => {
      initializeSocket()
      setTimeout(async () => {
        if (socket.isConnected.value) {
          await socket.setUserOnline(String(currentUser.value!.id))
          requestOnlineStatus('auto-init')
        }
      }, 1000)
    }, 100)
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
    isSendingMessage,
    
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
});
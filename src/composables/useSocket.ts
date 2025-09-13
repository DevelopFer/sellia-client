import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

// Socket connection state
const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const connectionError = ref<string | null>(null)

// Socket service composable
export function useSocket() {
  // Connect to the Socket.IO server
  const connect = (serverUrl: string = 'http://localhost:3001') => {
    if (socket.value?.connected) {
      console.log('Socket already connected')
      return
    }

    try {
      socket.value = io(serverUrl, {
        transports: ['websocket'],
        timeout: 20000,
      })

      // Connection event listeners
      socket.value.on('connect', () => {
        console.log('Socket connected:', socket.value?.id)
        isConnected.value = true
        connectionError.value = null
      })

      socket.value.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        isConnected.value = false
      })

      socket.value.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        connectionError.value = error.message
        isConnected.value = false
      })

    } catch (error) {
      console.error('Failed to create socket connection:', error)
      connectionError.value = 'Failed to create socket connection'
    }
  }

  // Disconnect from the Socket.IO server
  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  // Emit an event to the server
  const emit = (event: string, data?: any) => {
    if (socket.value?.connected) {
      socket.value.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }

  // Listen for an event from the server
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  // Remove listener for an event
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  // User online/offline methods
  const setUserOnline = (userId: string) => {
    emit('user:online', { userId })
  }

  const setUserOffline = (userId: string) => {
    emit('user:offline', { userId })
  }

  // Conversation methods
  const joinConversation = (conversationId: string, userId: string) => {
    emit('conversation:join', { conversationId, userId })
  }

  const leaveConversation = (conversationId: string, userId: string) => {
    emit('conversation:leave', { conversationId, userId })
  }

  // Message methods
  const onNewMessage = (callback: (event: MessageEvent) => void) => {
    on('message:new', callback)
  }

  const offNewMessage = (callback?: (event: MessageEvent) => void) => {
    off('message:new', callback)
  }

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    // State
    socket: socket.value,
    isConnected,
    connectionError,
    
    // Methods
    connect,
    disconnect,
    emit,
    on,
    off,
    
    // User status methods
    setUserOnline,
    setUserOffline,
    
    // Conversation methods
    joinConversation,
    leaveConversation,
    
    // Message methods
    onNewMessage,
    offNewMessage,
  }
}

// Socket event types for TypeScript
export interface UserStatusEvent {
  userId: string
  isOnline: boolean
  timestamp: string
}

export interface ConversationEvent {
  conversationId: string
  userId: string
  timestamp: string
}

export interface MessageEvent {
  conversationId: string
  message: {
    id: string
    content: string
    senderId: string
    conversationId: string
    createdAt: string
    sender: {
      id: string
      name: string
    }
  }
  timestamp: string
}

export interface SocketError {
  message: string
}
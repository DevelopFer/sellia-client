import { ref, onUnmounted } from 'vue'
import { io, Socket } from 'socket.io-client'

// Socket connection state
const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const connectionError = ref<string | null>(null)

// Socket service composable
export function useSocket() {
  // Get the API URL from environment variables and convert to WebSocket URL
  const getSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    // Remove '/api' suffix if present and ensure we have the base URL
    const baseUrl = apiUrl.replace('/api', '')
    return baseUrl
  }

  // Connect to the Socket.IO server
  const connect = (serverUrl?: string) => {
    if (socket.value?.connected) {
      console.log('Socket already connected')
      return
    }

    // Use provided URL or derive from environment
    const socketUrl = serverUrl || getSocketUrl()
    console.log('Connecting to Socket.IO server:', socketUrl)

    try {
      socket.value = io(socketUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
      })

      // Connection event listeners
      socket.value.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket.value?.id)
        console.log('Socket URL:', socketUrl)
        isConnected.value = true
        connectionError.value = null
      })

      socket.value.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason)
        isConnected.value = false
      })

      socket.value.on('connect_error', (error) => {
        console.error('🔥 Socket connection error:', error)
        console.error('Attempted URL:', socketUrl)
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

  // Check if socket is ready for communication
  const isReady = () => {
    return socket.value?.connected || false
  }

  // Emit an event to the server
  const emit = (event: string, data?: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (socket.value?.connected) {
        socket.value.emit(event, data)
        resolve()
      } else if (socket.value) {
        // If socket exists but not connected, wait for connection
        console.log('Socket not connected yet, waiting for connection to emit:', event)
        
        // Set up timeout for connection
        const timeout = setTimeout(() => {
          reject(new Error(`Socket connection timeout for event: ${event}`))
        }, 10000) // 10 second timeout
        
        socket.value.once('connect', () => {
          clearTimeout(timeout)
          console.log('Socket connected, now emitting delayed event:', event)
          socket.value!.emit(event, data)
          resolve()
        })
        
        socket.value.once('connect_error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      } else {
        console.warn('Socket not initialized, cannot emit event:', event)
        reject(new Error('Socket not initialized'))
      }
    })
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
  const setUserOnline = async (userId: string) => {
    try {
      await emit('user:online', { userId })
    } catch (error) {
      console.error('Failed to set user online:', error)
    }
  }

  const setUserOffline = async (userId: string) => {
    try {
      await emit('user:offline', { userId })
    } catch (error) {
      // For offline events, if socket is not available, it's acceptable
      // User is likely logging out or socket was already disconnected
      if (error instanceof Error && error.message === 'Socket not initialized') {
        console.log('Socket already disconnected, user offline status not needed')
      } else {
        console.error('Failed to set user offline:', error)
      }
    }
  }

  // Conversation methods
  const joinConversation = async (conversationId: string, userId: string) => {
    console.log('🚪 Joining conversation:', { conversationId, userId });
    try {
      await emit('conversation:join', { conversationId, userId })
      console.log('✅ Successfully joined conversation:', conversationId)
    } catch (error) {
      console.error('❌ Failed to join conversation:', error)
      throw error
    }
  }

  const leaveConversation = async (conversationId: string, userId: string) => {
    console.log('🚪 Leaving conversation:', { conversationId, userId });
    try {
      await emit('conversation:leave', { conversationId, userId })
      console.log('✅ Successfully left conversation:', conversationId)
    } catch (error) {
      console.error('❌ Failed to leave conversation:', error)
    }
  }

  // Message methods
  const onNewMessage = (callback: (event: MessageEvent) => void) => {
    const wrappedCallback = (event: MessageEvent) => {
      console.log('🔔 Message received via socket:', {
        conversationId: event.conversationId,
        messageId: event.message?.id,
        senderId: event.message?.senderId,
        timestamp: event.timestamp,
        content: event.message?.content?.substring(0, 50) + '...'
      });
      callback(event);
    };
    on('message:new', wrappedCallback)
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
    isReady,
    
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
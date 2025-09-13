import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Message, CurrentUser } from '@/types/chat'

export const useUsersStore = defineStore('users', () => {
  // State
  const currentUser = ref<CurrentUser>({
    id: 1,
    name: "You",
    status: "Online"
  })
  
  const users = ref<User[]>([
    { id: 2, name: "Alice Johnson", isOnline: true },
    { id: 3, name: "Bob Smith", isOnline: false },
    { id: 4, name: "Carol Williams", isOnline: true },
    { id: 5, name: "David Brown", isOnline: false },
    { id: 6, name: "Eva Martinez", isOnline: true },
  ])
  
  const messages = ref<Message[]>([
    {
      id: 1,
      senderId: 2,
      recipientId: 1,
      content: "Hey there! How are you doing?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 2,
      senderId: 1,
      recipientId: 2,
      content: "Hi Alice! I'm doing great, thanks for asking. How about you?",
      timestamp: new Date(Date.now() - 1000 * 60 * 25)
    },
    {
      id: 3,
      senderId: 2,
      recipientId: 1,
      content: "I'm wonderful! Just finished a great project at work.",
      timestamp: new Date(Date.now() - 1000 * 60 * 20)
    },
    {
      id: 4,
      senderId: 3,
      recipientId: 1,
      content: "Good morning! Are we still on for the meeting later?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    }
  ])
  
  const selectedUserId = ref<number | null>(null)

  // Getters
  const selectedUser = computed(() => {
    return users.value.find((user: User) => user.id === selectedUserId.value)
  })
  
  const getMessagesForUser = computed(() => {
    return (userId: number) => {
      return messages.value
        .filter((msg: Message) => 
          (msg.senderId === currentUser.value.id && msg.recipientId === userId) ||
          (msg.senderId === userId && msg.recipientId === currentUser.value.id)
        )
        .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime())
    }
  })
  
  const onlineUsersCount = computed(() => {
    return users.value.filter((user: User) => user.isOnline).length
  })

  // Actions
  const selectUser = (userId: number) => {
    selectedUserId.value = userId
  }
  
  const clearSelectedUser = () => {
    selectedUserId.value = null
  }
  
  const setCurrentUser = (user: CurrentUser) => {
    currentUser.value = user
  }
  
  const addMessage = (content: string, recipientId: number) => {
    if (!content.trim()) return
    
    const message: Message = {
      id: messages.value.length + 1,
      senderId: currentUser.value.id,
      recipientId,
      content: content.trim(),
      timestamp: new Date()
    }
    
    messages.value.push(message)
  }
  
  const updateUserStatus = (userId: number, isOnline: boolean) => {
    const user = users.value.find((u: User) => u.id === userId)
    if (user) {
      user.isOnline = isOnline
    }
  }
  
  const addUser = (user: User) => {
    users.value.push(user)
  }
  
  const removeUser = (userId: number) => {
    const index = users.value.findIndex((u: User) => u.id === userId)
    if (index > -1) {
      users.value.splice(index, 1)
      if (selectedUserId.value === userId) {
        selectedUserId.value = null
      }
    }
  }

  return {
    // State
    currentUser,
    users,
    messages,
    selectedUserId,
    // Getters
    selectedUser,
    getMessagesForUser,
    onlineUsersCount,
    // Actions
    selectUser,
    clearSelectedUser,
    setCurrentUser,
    addMessage,
    updateUserStatus,
    addUser,
    removeUser
  }
})
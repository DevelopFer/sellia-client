<template>
  <div :class="{ 'dark': isDark }">
    <div class="min-h-screen bg-background text-foreground">
      <header class="border-b">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center gap-4">
          <h1 class="text-xl font-bold flex-shrink-0">Sellia</h1>
          
          <!-- Search Bar - Hidden on login page -->
          <div v-if="!isLoginPage" class="flex-1 max-w-md mx-4">
            <SearchBar ref="searchBarRef" @result-selected="handleSearchResult" />
          </div>
          
          <Button variant="ghost" size="icon" @click="toggleDark()" class="flex-shrink-0">
            <SunIcon v-if="isDark" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView, useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import SearchBar from '@/components/SearchBar.vue'
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useUsersStore } from '@/stores/users'
import type { SearchMessageResult } from '@/types/api'

const isDark = useDark()
const toggleDark = useToggle(isDark)
const usersStore = useUsersStore()
const route = useRoute()
const router = useRouter()
const searchBarRef = ref()

// Check if we're on the login page to hide search bar
const isLoginPage = computed(() => route.path === '/login')

// Keyboard shortcut to focus search (Ctrl/Cmd + K)
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    if (!isLoginPage.value && searchBarRef.value) {
      searchBarRef.value.focusInput()
    }
  }
}

// Handle search result selection
const handleSearchResult = async (result: SearchMessageResult) => {
  try {
    // Navigate to home if not already there
    if (route.path !== '/') {
      await router.push('/')
    }
    
    // Get current user
    const currentUserId = usersStore.currentUser?.id
    if (!currentUserId) return

    // Find the other participant to select them (this will open the conversation)
    const otherParticipant = result.conversation.participants.find(
      p => p.id !== currentUserId
    )

    if (otherParticipant) {
      // This will trigger opening the conversation
      await usersStore.selectUser(otherParticipant.id)
      
      // TODO: In the future, we could scroll to the specific message
      // For now, just opening the conversation is sufficient
      console.log('Navigated to conversation for message:', result.id)
    }
  } catch (error) {
    console.error('Error navigating to search result:', error)
  }
}

// Handle cleanup when user closes browser/tab
const handleBeforeUnload = () => {
  usersStore.cleanupSocket()
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('keydown', handleKeydown)
  usersStore.cleanupSocket()
})
</script>
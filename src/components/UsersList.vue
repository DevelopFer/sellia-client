<script setup lang="ts">
    import { computed, onMounted } from 'vue'
    import { useUsersStore } from '@/stores/users'
    import UserCard from '@/components/UserCard.vue'
    import type { User } from '@/types/chat'

    const usersStore = useUsersStore()

    const users = computed(() => usersStore.users)
    const selectedUserId = computed(() => usersStore.selectedUserId)
    
    // Pagination computed properties
    const currentPage = computed(() => usersStore.currentPage)
    const totalPages = computed(() => usersStore.totalPages)
    const totalUsers = computed(() => usersStore.totalUsers)
    const hasNextPage = computed(() => usersStore.hasNextPage)
    const hasPrevPage = computed(() => usersStore.hasPrevPage)
    const isLoadingUsers = computed(() => usersStore.isLoadingUsers)

  const handleUserClick = (user: User) => {
    console.log('User clicked:', user.id)
    const userId = user.id // Keep as string for MongoDB ObjectID
    if (userId !== selectedUserId.value) {
        console.log('Selecting user with ID:', userId)
      usersStore.selectUser(userId)
    }
  }
  
  const handleNextPage = () => {
    usersStore.loadNextPage()
  }
    
  const handlePrevPage = () => {
    usersStore.loadPrevPage()
  }
    
    // Load initial users when component mounts
    onMounted(() => {
        usersStore.loadUsers(1)
    })
</script>

<template>
  <div class="flex-1 overflow-y-auto flex flex-col">
    <div class="p-2 flex-1">
      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
        Users ({{ totalUsers }})
      </h4>
      
      <!-- Loading state -->
      <div v-if="isLoadingUsers" class="flex justify-center items-center py-4">
        <svg class="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-sm text-gray-500">Loading users...</span>
      </div>
      
      <!-- Users list -->
      <div v-else class="space-y-1">
        <UserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :is-selected="selectedUserId === user.id"
          @click="handleUserClick"
        />
        
        <!-- Empty state -->
        <div v-if="users.length === 0" class="text-center py-4">
          <p class="text-sm text-gray-500">No users found</p>
        </div>
      </div>
    </div>
    
    <!-- Pagination controls -->
    <div class="border-t bg-gray-50 px-2 py-3">
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-500">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        <div class="flex space-x-2">
          <button
            @click="handlePrevPage"
            :disabled="!hasPrevPage || isLoadingUsers"
            class="px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          <button
            @click="handleNextPage"
            :disabled="!hasNextPage || isLoadingUsers"
            class="px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
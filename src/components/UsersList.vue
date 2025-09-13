<script setup lang="ts">
    import { computed } from 'vue'
    import { useUsersStore } from '@/stores/users'
    import UserCard from '@/components/UserCard.vue'
    import type { User } from '@/types/chat'

    const usersStore = useUsersStore()

    const users = computed(() => usersStore.users)
    const selectedUserId = computed(() => usersStore.selectedUserId)

    const handleUserClick = (user: User) => {
        usersStore.selectUser(user.id)
    }
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <div class="p-2">
      <h4 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
        Users ({{ users.length }})
      </h4>
      <div class="space-y-1">
        <UserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :is-selected="selectedUserId === user.id"
          @click="handleUserClick"
        />
      </div>
    </div>
  </div>
</template>
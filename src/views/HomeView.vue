<template>
  <div class="h-screen flex bg-gray-50">
    <div :class="[
      'bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out',
      'w-full md:w-80',
      'md:block',
      selectedUser && 'hidden md:block'
    ]">
      <div class="p-4 md:p-4 border-b border-gray-200">
        <UserProfile />
      </div>
      <UsersList />
    </div>
    <div :class="['flex-1 flex flex-col',!selectedUser && 'hidden md:flex',selectedUser && 'flex']">
      <div v-if="selectedUser" class="flex-1 flex flex-col">
        <div class="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
          <div class="flex items-center space-x-3">
            <GoBackButton/>
            <ConversationHeader/>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50">
          <MessagesList />
        </div>
        <InputMessage />
      </div>
      <ConversationEmptyState v-else/>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {computed } from 'vue';
  import { useUsersStore } from '@/stores/users';
  import UserProfile from '@/components/UserProfile.vue';
  import UsersList from '@/components/UsersList.vue';
  import MessagesList from '@/components/messages/MessagesList.vue';
  import GoBackButton from '@/components/layout/GoBackButton.vue';
  import ConversationHeader from '@/components/layout/ConversationHeader.vue';
  import InputMessage from '@/components/layout/InputMessage.vue';
  import ConversationEmptyState from '@/components/layout/ConversationEmptyState.vue';

  // Use Pinia store
  const usersStore = useUsersStore();

  const selectedUser = computed(() => usersStore.selectedUser);


</script>
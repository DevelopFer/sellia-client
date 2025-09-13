<script lang="ts" setup>
    
    import { useUsersStore } from '@/stores/users';

    const usersStore = useUsersStore();
    
    const goBackToUsersList = () => {
        usersStore.clearSelectedUser();
    };
    
</script>

<template>
    <button 
        @click="goBackToUsersList"
        class="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Back to users list"
    >
        <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
    </button>
</template>
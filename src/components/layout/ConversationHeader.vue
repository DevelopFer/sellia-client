<script lang="ts" setup>
    
    import { computed } from 'vue';
    import { useUsersStore } from '@/stores/users';

    const usersStore = useUsersStore();
    const selectedUser = computed(() => usersStore.selectedUser);

</script>

<template>
    <div class="relative">
        <div class="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
        <img 
            v-if="selectedUser.avatar" 
            :src="selectedUser.avatar" 
            :alt="selectedUser.name"
            class="w-full h-full rounded-full object-cover"
        />
        <svg 
            v-else
            class="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        </div>
        <div :class="[
        'absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full',
        selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
        ]"></div>
    </div>
    <div>
        <h2 class="font-semibold text-gray-900">{{ selectedUser.name }}</h2>
        <p :class="[
        'text-sm',
        selectedUser.isOnline ? 'text-green-600' : 'text-gray-500'
        ]">
        {{ selectedUser.isOnline ? 'Online' : 'Offline' }}
        </p>
    </div>
</template>
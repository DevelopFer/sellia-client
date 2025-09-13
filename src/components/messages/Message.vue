<script setup lang="ts">
    import { computed } from 'vue'
    import { useUsersStore } from '@/stores/users'
    import type { Message } from '@/types/chat'

    const props = defineProps<{
        message: Message
        currentUserId: number
        formatTime: (date: Date) => string
    }>()

    const usersStore = useUsersStore()
    
    const currentUser = computed(() => usersStore.currentUser)

</script>

<template>
    <div :class="['max-w-[85%] md:max-w-xs lg:max-w-md px-4 py-3 md:py-2 rounded-lg',
        message.senderId === currentUser.id
        ? 'bg-blue-500 text-white'
        : 'bg-white text-gray-900 border border-gray-200'
    ]">
        <p class="text-sm md:text-sm leading-relaxed">{{ message.content }}</p>
        <p :class="[
        'text-xs mt-1',
        message.senderId === currentUser.id ? 'text-blue-100' : 'text-gray-500'
        ]">
        {{ formatTime(message.timestamp) }}
        </p>
    </div>
</template>
<script setup lang="ts">
    import { useUsersStore } from '@/stores/users'
    import { computed } from 'vue';
    
    const usersStore = useUsersStore();
    const currentUser = computed(() => usersStore.currentUser)
    const selectedUser = computed(() => usersStore.selectedUser);

    const currentMessages = computed(() => {
        if (!selectedUser.value) return [];
        return usersStore.getMessagesForUser(selectedUser.value.id);
    });

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

</script>

<template>
    <div v-for="message in currentMessages"
    :key="message.id"
    :class="[
        'flex',
        message.senderId === currentUser.id ? 'justify-end' : 'justify-start'
    ]">
        <div :class="[
            'max-w-[85%] md:max-w-xs lg:max-w-md px-4 py-3 md:py-2 rounded-lg',
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
    </div>
</template>
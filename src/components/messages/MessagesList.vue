<script setup lang="ts">
    import { useUsersStore } from '@/stores/users'
    import { computed, watch, nextTick, ref, onMounted } from 'vue';
    
    const usersStore = useUsersStore();
    const currentUser = computed(() => usersStore.currentUser)
    const selectedUser = computed(() => usersStore.selectedUser);
    const isLoadingMessages = computed(() => usersStore.isLoadingMessages);

    const messagesContainer = ref<HTMLElement | null>(null);

    const currentMessages = computed(() => {
        return usersStore.currentMessages;
    });

    const formatTime = (dateInput: Date | string | undefined) => {
        if (!dateInput) return '';
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };


    const scrollToBottom = async (smooth = true) => {
        await nextTick();
        if (messagesContainer.value) {
            messagesContainer.value.scrollTo({
                top: messagesContainer.value.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

    /** Whenever a new message is received, here we're scrolling to the bottom */
    watch(currentMessages, (newMessages, oldMessages) => {
        if (newMessages && newMessages.length > 0) {
            if (!oldMessages || newMessages.length > oldMessages.length) {
                scrollToBottom();
            }
        }
    }, { deep: true });

    
    watch(isLoadingMessages, (newLoading, oldLoading) => {
        if (oldLoading && !newLoading && currentMessages.value && currentMessages.value.length > 0) {
            scrollToBottom(false);
        }
    });

    onMounted(async () => {
        await scrollToBottom();
    });

</script>

<template>
    
    <div v-if="isLoadingMessages" class="flex justify-center items-center py-8">
        <svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-sm text-gray-500">Loading messages...</span>
    </div>

    <div v-else-if="currentMessages.length > 0 && currentUser" 
         ref="messagesContainer"
         class="overflow-y-auto h-full">
        <div v-for="message in currentMessages"
        :key="message.id"
        :class="[
            'flex mb-4',
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
                {{ formatTime(message.timestamp || message.createdAt) }}
                </p>
            </div>
        </div>
    </div>

    <div v-else-if="selectedUser" class="flex justify-center items-center py-8">
        <div class="text-center">
            <p class="text-gray-500">No messages yet</p>
            <p class="text-sm text-gray-400 mt-1">Start a conversation with {{ selectedUser.name }}</p>
        </div>
    </div>

</template>
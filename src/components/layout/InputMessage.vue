<script setup lang="ts">
    import { ref, computed } from 'vue';
    import { useUsersStore } from '@/stores/users';
    import { Button } from '@/components/ui/button';
    
    const newMessage = ref('');
    const usersStore = useUsersStore();
    const selectedUser = computed(() => usersStore.selectedUser);

    const sendMessage = () => {
        if (!newMessage.value.trim() || !selectedUser.value) return;
        usersStore.addMessage(newMessage.value, selectedUser.value.id);
        newMessage.value = '';
    };

</script>

<template>
     <div class="bg-white border-t border-gray-200 p-4">
        <div class="flex space-x-3 md:space-x-4">
            <input
                v-model="newMessage"
                @keyup.enter="sendMessage"
                type="text"
                placeholder="Type a message..."
                class="flex-1 px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style="font-size: 16px;" 
            />
            <Button
                @click="sendMessage"
                :disabled="!newMessage.trim()"
                class="px-6 py-3 md:py-2 text-sm md:text-sm min-w-[80px] md:min-w-[auto]"
            >
                Send
            </Button>
        </div>
    </div>    
</template>
<script setup lang="ts">
  
  import { ref } from 'vue';

  const currentUser = ref({
    id: 1,
    name: "You",
    status: "Online"
  });

</script>
<template>
    <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
            <div class="relative">
                <div class="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                </div>
                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div>
                <h3 class="font-semibold text-gray-900">{{ currentUser.name }}</h3>
                <p class="text-sm text-green-600">{{ currentUser.status }}</p>
            </div>
        </div>
        
        <div class="md:hidden">
            <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
        </div>
        
    </div>
</template>
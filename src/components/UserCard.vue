<template>
  <div
    @click="handleClick"
    :class="[
      'flex items-center p-4 md:p-3 rounded-lg cursor-pointer transition-colors',
      'min-h-[60px] md:min-h-[auto]',
      isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 active:bg-gray-100'
    ]"
  >
    <div class="relative mr-3 md:mr-3">
      <div class="w-12 h-12 md:w-10 md:h-10 bg-gray-300 rounded-full flex items-center justify-center">
        <img 
          v-if="user.avatar" 
          :src="user.avatar" 
          :alt="user.name"
          class="w-full h-full rounded-full object-cover"
        />
        <svg 
          v-else
          class="w-6 h-6 md:w-5 md:h-5 text-gray-600" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            stroke-linecap="round" 
            stroke-linejoin="round" 
            stroke-width="2" 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </div>
      
      <div :class="[
        'absolute -bottom-1 -right-1 w-4 h-4 md:w-3 md:h-3 border-2 border-white rounded-full',
        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
      ]"></div>
    </div>
    
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <p class="font-medium text-gray-900 truncate text-base md:text-sm">
          {{ user.name }}
        </p>
        <!-- Unread message badge -->
        <div 
          v-if="user.unreadCount && user.unreadCount > 0"
          class="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center ml-2"
        >
          {{ user.unreadCount > 99 ? '99+' : user.unreadCount }}
        </div>
      </div>
      <p class="text-xs text-gray-600 truncate mb-1">
        @{{ user.username }}
      </p>
      <p :class="[
        'truncate text-sm md:text-sm',
        user.isOnline ? 'text-green-600' : 'text-gray-500'
      ]">
        {{ user.isOnline ? 'Online' : 'Offline' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
    
    import type { User } from '@/types/chat'
    
    const emit = defineEmits<Emits>()

    interface Props {
        user: User
        isSelected?: boolean
    }

    interface Emits {
        (e: 'click', user: User): void
    }

    const props = withDefaults(defineProps<Props>(), {
        isSelected: false
    });

    const handleClick = () => {
        emit('click', props.user)
    };

</script>
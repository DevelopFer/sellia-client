<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <SearchIcon class="h-4 w-4 text-gray-400" />
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search messages..."
        class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        @focus="openSearch"
        @keydown.escape="closeSearch"
        @keydown.enter.prevent="handleEnterKey"
        ref="searchInput"
      />
      
      <!-- Clear button -->
      <div v-if="hasQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          @click="clearSearch"
          class="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
          type="button"
        >
          <XIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults"
      class="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto"
    >
      <!-- Loading State -->
      <div v-if="isSearching" class="p-4 text-center text-gray-500">
        <div class="inline-flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Searching...
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="searchError" class="p-4 text-center text-red-500 text-sm">
        {{ searchError }}
      </div>

      <!-- No Results -->
      <div v-else-if="!hasResults && hasQuery && !isSearching" class="p-4 text-center text-gray-500 text-sm">
        No messages found for "{{ searchQuery }}"
      </div>

      <!-- Search Results -->
      <div v-else-if="hasResults" class="py-1">
        <div
          v-for="(result, index) in searchResults"
          :key="result.id"
          @click="selectResult(result)"
          class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
          :class="{ 'bg-blue-50': index === selectedIndex }"
        >
          <!-- Message Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <!-- Sender and Time -->
                <div class="flex items-center space-x-2 mb-1">
                  <span class="text-sm font-medium text-gray-900 truncate">
                    {{ result.sender.name || result.sender.username }}
                  </span>
                  <span class="text-xs text-gray-500">
                    {{ getRelativeTime(result.createdAt) }}
                  </span>
                </div>
                
                <!-- Message Content with Highlighting -->
                <div 
                  class="text-sm text-gray-600 line-clamp-2 mb-1"
                  v-html="result.highlightedContent"
                ></div>
                
                <!-- Conversation Info -->
                <div class="text-xs text-gray-500 truncate">
                  <MessageSquareIcon class="inline h-3 w-3 mr-1" />
                  {{ getConversationTitle(result) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with search tip -->
      <div v-if="hasQuery && !isSearching" class="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p class="text-xs text-gray-500 text-center">
          Press Enter to search • ESC to close
        </p>
      </div>
    </div>

    <!-- Backdrop to close dropdown when clicking outside -->
    <div
      v-if="showResults"
      class="fixed inset-0 z-40"
      @click="closeSearch"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useSearch } from '@/composables/useSearch'
import { SearchIcon, XIcon, MessageSquareIcon } from 'lucide-vue-next'
import type { SearchMessageResult } from '@/types/api'

// Emits
const emit = defineEmits<{
  resultSelected: [result: SearchMessageResult]
}>()

// Use the search composable
const {
  searchQuery,
  searchResults,
  isSearching,
  searchError,
  hasResults,
  hasQuery,
  showResults,
  clearSearch,
  closeSearch,
  openSearch,
  selectResult: baseSelectResult,
  getConversationTitle,
  getRelativeTime
} = useSearch()

// Component state
const searchInput = ref<HTMLInputElement>()
const selectedIndex = ref(-1)

// Enhanced select result function
const selectResult = (result: SearchMessageResult) => {
  emit('resultSelected', result)
  baseSelectResult(result)
}

// Keyboard navigation
const handleEnterKey = () => {
  if (hasResults.value && selectedIndex.value >= 0) {
    selectResult(searchResults.value[selectedIndex.value])
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!showResults.value) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, searchResults.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, -1)
      break
    case 'Escape':
      event.preventDefault()
      closeSearch()
      break
  }
}

// Focus management
const focusInput = () => {
  nextTick(() => {
    searchInput.value?.focus()
  })
}

// Reset selected index when results change
watch(searchResults, () => {
  selectedIndex.value = -1
})

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods for parent components
defineExpose({
  focusInput,
  clearSearch
})
</script>

<style scoped>
/* Custom styles for highlighted search terms */
:deep(mark) {
  background-color: #fef3c7;
  color: #92400e;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
}

/* Line clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
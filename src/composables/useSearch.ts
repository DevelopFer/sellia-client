import { ref, computed, watch } from 'vue'
import { messagesApi } from '@/api/messages'
import type { SearchMessageResult } from '@/types/api'
import { useDebounceFn } from '@vueuse/core'

// Simple cache implementation
const searchCache = new Map<string, SearchMessageResult[]>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const cacheTimestamps = new Map<string, number>()

export function useSearch() {
  const searchQuery = ref('')
  const searchResults = ref<SearchMessageResult[]>([])
  const isSearching = ref(false)
  const isSearchOpen = ref(false)
  const searchError = ref<string | null>(null)

  // Clear expired cache entries
  const clearExpiredCache = () => {
    const now = Date.now()
    for (const [key, timestamp] of cacheTimestamps.entries()) {
      if (now - timestamp > CACHE_TTL) {
        searchCache.delete(key)
        cacheTimestamps.delete(key)
      }
    }
  }

  // Get from cache if available and not expired
  const getFromCache = (query: string): SearchMessageResult[] | null => {
    clearExpiredCache()
    const cached = searchCache.get(query.toLowerCase())
    if (cached && cacheTimestamps.has(query.toLowerCase())) {
      return cached
    }
    return null
  }

  // Save to cache
  const saveToCache = (query: string, results: SearchMessageResult[]) => {
    const key = query.toLowerCase()
    searchCache.set(key, results)
    cacheTimestamps.set(key, Date.now())
  }

  // Debounced search function to avoid too many API calls
  const debouncedSearch = useDebounceFn(async (query: string) => {
    if (!query || query.trim().length < 2) {
      searchResults.value = []
      isSearching.value = false
      return
    }

    const trimmedQuery = query.trim()

    // Check cache first
    const cached = getFromCache(trimmedQuery)
    if (cached) {
      searchResults.value = cached
      isSearching.value = false
      return
    }

    try {
      isSearching.value = true
      searchError.value = null
      const results = await messagesApi.searchMessages(trimmedQuery)
      searchResults.value = results
      
      // Cache the results
      saveToCache(trimmedQuery, results)
    } catch (error) {
      console.error('Search error:', error)
      searchError.value = 'Failed to search messages. Please try again.'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300) // 300ms debounce

  // Watch for search query changes
  watch(searchQuery, (newQuery) => {
    if (newQuery.trim().length === 0) {
      searchResults.value = []
      isSearching.value = false
      isSearchOpen.value = false
      return
    }

    if (newQuery.trim().length >= 2) {
      isSearchOpen.value = true
      debouncedSearch(newQuery)
    }
  })

  // Computed properties
  const hasResults = computed(() => searchResults.value.length > 0)
  const hasQuery = computed(() => searchQuery.value.trim().length > 0)
  const showResults = computed(() => isSearchOpen.value && hasQuery.value)

  // Methods
  const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    isSearchOpen.value = false
    searchError.value = null
  }

  const closeSearch = () => {
    isSearchOpen.value = false
  }

  const openSearch = () => {
    if (hasQuery.value) {
      isSearchOpen.value = true
    }
  }

  const selectResult = (result: SearchMessageResult) => {
    // This will be implemented to navigate to the conversation
    closeSearch()
    return result
  }

  // Clear all cached search results
  const clearCache = () => {
    searchCache.clear()
    cacheTimestamps.clear()
  }

  // Format conversation title for display
  const getConversationTitle = (result: SearchMessageResult) => {
    if (result.conversation.title) {
      return result.conversation.title
    }
    
    if (result.conversation.isGroup) {
      return `Group with ${result.conversation.participants.length} members`
    }
    
    // For direct messages, show the other participant's name
    const otherParticipants = result.conversation.participants
      .filter(p => p.id !== result.sender.id)
      .map(p => p.name || p.username)
    
    return otherParticipants.length > 0 
      ? `Chat with ${otherParticipants.join(', ')}`
      : 'Direct Message'
  }

  // Format relative time for display
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    }
  }

  return {
    // State
    searchQuery,
    searchResults,
    isSearching,
    isSearchOpen,
    searchError,
    
    // Computed
    hasResults,
    hasQuery,
    showResults,
    
    // Methods
    clearSearch,
    closeSearch,
    openSearch,
    selectResult,
    clearCache,
    getConversationTitle,
    getRelativeTime
  }
}
// Export the main API client and utilities
export { default as apiClient, api, setAuthToken, clearAuthToken, getAuthToken } from './client'

// Export specific API modules
export * from './auth'
export * from './messages'

// Export types
export type * from '@/types/api'
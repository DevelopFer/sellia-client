import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/api'

// Create the main API client
export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add timestamp for cache busting if needed
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ Response Error:', error)

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token')
          window.location.href = '/login'
          break
        case 403:
          console.error('Forbidden: You do not have permission to access this resource')
          break
        case 404:
          console.error('Not Found: The requested resource was not found')
          break
        case 500:
          console.error('Server Error: Internal server error occurred')
          break
        default:
          console.error(`API Error ${status}:`, data?.message || error.message)
      }

      // Transform error to our standard format
      const apiError: ApiError = {
        message: data?.message || 'An error occurred',
        statusCode: status,
        error: data?.error,
        details: data,
      }
      
      return Promise.reject(apiError)
    } else if (error.request) {
      // Network error
      const networkError: ApiError = {
        message: 'Network error - please check your connection',
        statusCode: 0,
        error: 'NETWORK_ERROR',
      }
      return Promise.reject(networkError)
    } else {
      // Something else happened
      const unknownError: ApiError = {
        message: error.message || 'An unknown error occurred',
        statusCode: 0,
        error: 'UNKNOWN_ERROR',
      }
      return Promise.reject(unknownError)
    }
  }
)

// Utility functions for common API patterns
export const api = {
  // GET request with typed response
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config).then(response => response.data)
  },

  // POST request with typed response
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config).then(response => response.data)
  },

  // PUT request with typed response
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config).then(response => response.data)
  },

  // PATCH request with typed response
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.patch(url, data, config).then(response => response.data)
  },

  // DELETE request with typed response
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config).then(response => response.data)
  },

  // Upload file with progress tracking
  upload: <T = any>(
    url: string, 
    file: File, 
    onProgress?: (progressEvent: any) => void
  ): Promise<T> => {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    }).then(response => response.data)
  },
}

// Helper functions
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token)
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token')
  delete apiClient.defaults.headers.common['Authorization']
}

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

// Export the configured axios instance for direct use if needed
export { apiClient as default }
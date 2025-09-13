<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join the Chat
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Enter your details to start chatting
        </p>
      </div>
      
      <form @submit.prevent="handleLogin" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              v-model="loginForm.username"
              type="text"
              id="username"
              name="username"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              v-model="loginForm.name"
              type="text"
              id="name"
              name="name"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Enter your display name"
            />
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600 text-center bg-red-50 p-3 rounded-md">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="isLoading || !loginForm.username || !loginForm.name"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="isLoading">Joining...</span>
            <span v-else>Join Chat</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { usersApi } from '@/api'

const router = useRouter()
const usersStore = useUsersStore()

// Login form state
const loginForm = ref({
  username: '',
  name: ''
})
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.name) {
    error.value = 'Please fill in all fields'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    // Call the login-or-register endpoint
    const user = await usersApi.loginOrRegister({
      username: loginForm.value.username.trim(),
      name: loginForm.value.name.trim()
    })

    // Convert to CurrentUser format and set in store
    usersStore.setCurrentUser({
      id: user.id,
      name: user.name || user.username,
      status: 'Online'
    })

    // Load the users list
    await usersStore.loadUsers()

    // Redirect to home page
    router.push('/')

    // Clear the form
    loginForm.value = { username: '', name: '' }
  } catch (err: any) {
    console.error('Login failed:', err)
    error.value = err.message || 'Failed to join chat. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
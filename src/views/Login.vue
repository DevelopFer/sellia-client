<script setup lang="ts">
    import { ref, watch, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import { useUsersStore } from '@/stores/users';
    import { usersApi } from '@/api';
    import { Button } from '@/components/ui/button';

    onMounted(() => {
        const input = document.getElementById('name');
        if (input) {
            input.focus();
        }
    });

    const router = useRouter();
    const usersStore = useUsersStore();

    const username = ref('');
    const name = ref('');
    const isLoading = ref(false);
    const usernameError = ref('');


    const isValidUsername = (value: string): boolean => {
        const validPattern = /^[A-Za-z0-9@_#]*$/;
        return validPattern.test(value);
    };

    const filterUsernameInput = (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = target.value;
        
        const filteredValue = value.replace(/[^A-Za-z0-9@_#]/g, '');
        
        if (filteredValue !== value) {
            target.value = filteredValue;
            username.value = filteredValue;
        }
    };

    watch(username, async (newUsername) => {
        if (!newUsername.trim()) {
            usernameError.value = '';
            return;
        }
        
        if (!isValidUsername(newUsername)) {
            usernameError.value = 'Username can only contain letters, numbers, and symbols @, _, #';
            return;
        }

        if (newUsername.length < 3) {
            usernameError.value = 'Username must be at least 3 characters';
            return;
        }

        usernameError.value = '';
    });

    const handleLogin = async () => {
        if (!username.value.trim()) return;
        if (!name.value.trim()) return;

        isLoading.value = true;

        try {
            const user = await usersApi.loginOrRegister({
                username: username.value.trim(),
                name: name.value.trim()
            });

            usersStore.setCurrentUser({
                id: user.id,
                name: user.name || user.username,
                status: "Online"
            });
            
            await router.push('/conversations');

            } catch (error) {
                console.error('Login error:', error);
            } finally {
                isLoading.value = false;
            }
        }
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Sellia</h1>
        <p class="text-gray-600">Enter your details to access chat</p>
      </div>
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="name" class="sr-only">Full Name</label>
          <input
            id="name"
            v-model="name"
            type="text"
            required
            placeholder="Enter your full name"
            class="w-full px-4 py-4 text-lg text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            :disabled="isLoading"
          />
        </div>
        <div>
          <label for="username" class="sr-only">Username</label>
          <div class="relative">
            <input
              id="username"
              v-model="username"
              type="text"
              required
              placeholder="Enter your username (letters, numbers, @, _, #)"
              pattern="[A-Za-z0-9@_#]+"
              title="Username can only contain letters, numbers, and symbols @, _, #"
              @input="filterUsernameInput"
              :class="[
                'w-full px-4 py-4 text-lg text-gray-900 placeholder-gray-500 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-colors',
                usernameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
              ]"
              :disabled="isLoading"
            />
          </div>
          <div class="mt-2 text-sm" v-if="usernameError">
            <p class="text-red-600">{{ usernameError }}</p>
          </div>
          <div class="mt-1 text-xs text-gray-500">
            Allowed characters: letters (A-z), numbers (0-9), and symbols @, _, #
          </div>
        </div>

        <Button
          type="submit"
          :disabled="!name.trim() || !username.trim() || !!usernameError || isLoading"
          class="w-full py-4 text-lg font-medium"
        >
          <span v-if="isLoading" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Accessing...
          </span>
          <span v-else>Access</span>
        </Button>
      </form>
      <div class="text-center">
        <p class="text-sm text-gray-500">
          Welcome to Sellia Chat Platform
        </p>
      </div>
    </div>
  </div>
</template>
<template>
  <div :class="{ 'dark': isDark }">
    <div class="min-h-screen bg-background text-foreground">
      <header class="border-b">
        <div class="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 class="text-xl font-bold">Sellia</h1>
          <Button variant="ghost" size="icon" @click="toggleDark()">
            <SunIcon v-if="isDark" class="h-5 w-5" />
            <MoonIcon v-else class="h-5 w-5" />
          </Button>
        </div>
      </header>
      
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Button } from '@/components/ui/button'
import { SunIcon, MoonIcon } from 'lucide-vue-next'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>
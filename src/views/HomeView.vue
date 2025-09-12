<template>
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-6">Welcome to Sellia</h1>
    
    <div class="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            Card Description
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter class="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button>Submit</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Available actions you can take
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-2">
          <Button variant="default" class="w-full">
            Default Button
          </Button>
          <Button variant="secondary" class="w-full">
            Secondary Button
          </Button>
          <Button variant="outline" class="w-full">
            Outline Button
          </Button>
          <Button variant="ghost" class="w-full">
            Ghost Button
          </Button>
          <Button variant="destructive" class="w-full">
            Destructive Button
          </Button>
        </CardContent>
      </Card>
    </div>
  </main>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
</script>
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import { useUsersStore } from '@/stores/users'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView
    }
  ]
})

// Navigation guard to protect routes that require authentication
router.beforeEach((to, _from, next) => {
  const usersStore = useUsersStore()
  
  if (to.meta.requiresAuth && !usersStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && usersStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
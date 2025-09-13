import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Login from '../views/Login.vue'
import { useUsersStore } from '@/stores/users'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/conversations'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/conversations',
      name: 'conversations',
      component: HomeView,
      meta: { requiresAuth: true }
    }
  ]
})

// Navigation guard to protect routes that require authentication
router.beforeEach((to, _from, next) => {
  const usersStore = useUsersStore()
  
  if (to.meta.requiresAuth && !usersStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && usersStore.isAuthenticated) {
    next('/conversations')
  } else {
    next()
  }
})

export default router
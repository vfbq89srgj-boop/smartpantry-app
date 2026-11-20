/*
  Which URL shows which screen.
  Hash history (#/pantry) is used because it works inside the iOS app wrapper.
*/
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import PantryView from './views/PantryView.vue'
import ScanView from './views/ScanView.vue'
import LoginView from './views/LoginView.vue'
import { authConfigured } from './lib/supabase'
import { session } from './data/auth'
import ComingSoon from './components/ComingSoon.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/', component: HomeView },
    // Placeholders – each one gets its own screen in the next steps
    { path: '/pantry', component: PantryView },
    { path: '/shopping-list', component: ComingSoon, props: { title: 'Shopping list', text: 'Add, check off and swipe away items. Coming soon.' } },
    { path: '/impact', component: ComingSoon, props: { title: 'Impact', text: 'How much food you rescued instead of wasting. Coming soon.' } },
    { path: '/scan', component: ScanView },
    { path: '/recipes', component: ComingSoon, props: { title: 'Recipe ideas', text: 'Recipes that use what expires first. Coming soon.' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

// Without login you only see the login screen (skipped in demo mode without Supabase values)
router.beforeEach((to) => {
  if (!authConfigured) return true
  if (!to.meta.public && !session.value) return '/login'
  if (to.path === '/login' && session.value) return '/'
  return true
})

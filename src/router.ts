/*
  Which URL shows which screen.
  Hash history (#/pantry) is used because it works inside the iOS app wrapper.
*/
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import PantryView from './views/PantryView.vue'
import ComingSoon from './components/ComingSoon.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomeView },
    // Placeholders – each one gets its own screen in the next steps
    { path: '/pantry', component: PantryView },
    { path: '/shopping-list', component: ComingSoon, props: { title: 'Shopping list', text: 'Add, check off and swipe away items. Coming soon.' } },
    { path: '/impact', component: ComingSoon, props: { title: 'Impact', text: 'How much food you rescued instead of wasting. Coming soon.' } },
    { path: '/scan', component: ComingSoon, props: { title: 'Scan receipt', text: 'Take a photo of your receipt – the AI does the rest. Coming soon.' } },
    { path: '/recipes', component: ComingSoon, props: { title: 'Recipe ideas', text: 'Recipes that use what expires first. Coming soon.' } },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

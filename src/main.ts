// Starting point of the app: load fonts and styles, check the login, then show App.vue
import { createApp } from 'vue'
import '@fontsource-variable/inter'
import './styles/theme.css'
import './styles/base.css'
import App from './App.vue'
import { router } from './router'
import { initAuth } from './data/auth'

initAuth().then(() => {
  createApp(App).use(router).mount('#app')
})

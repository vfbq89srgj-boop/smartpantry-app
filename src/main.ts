// Starting point of the app: load fonts and styles, then show App.vue
import { createApp } from 'vue'
import '@fontsource-variable/inter'
import './styles/theme.css'
import './styles/base.css'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')

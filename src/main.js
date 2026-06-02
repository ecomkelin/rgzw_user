import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import { initErrorHandler } from './utils/errorHandler'
import './styles/global.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 初始化全局错误处理：覆盖 Vue errorHandler、window.onerror、unhandledrejection
initErrorHandler(app)

app.mount('#app')
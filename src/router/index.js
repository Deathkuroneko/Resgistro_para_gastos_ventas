import { createRouter, createWebHistory } from 'vue-router'
// 1. Importamos tus nuevas pantallas limpias
import Dashboard from '../views/Dashboard.vue'
import Ventas from '../views/Ventas.vue'
import Inventario from '../views/Inventario.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/ventas',
      name: 'ventas',
      component: Ventas
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: Inventario
    }
  ]
})

export default router
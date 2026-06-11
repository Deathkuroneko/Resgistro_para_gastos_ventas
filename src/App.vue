<template>
  <div id="app-container">
    <main class="content">
      <RouterView />
    </main>

    <nav class="bottom-nav">
      <RouterLink to="/ventas" class="nav-item">🛒 Ventas</RouterLink>
      <RouterLink to="/" class="nav-item">📊 Dashboard</RouterLink>
      <RouterLink to="/inventario" class="nav-item">📦 Inventario</RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { initDatabase } from '@/services/db.js';

// 🚀 Esto se ejecuta apenas el celular abre la aplicación
onMounted(async () => {
  try {
    console.log("📱 App.vue montada. Iniciando verificación de SQLite...");
    await initDatabase();
    console.log("✅ Base de datos lista con todas sus tablas.");
  } catch (error) {
    console.error("❌ Error crítico al inicializar las tablas en Android:", error);
  }
});
</script>

<style>
/* Reset básico para que parezca app de celular */
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: sans-serif;
}

#app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 70px; /* Espacio para que el menú no tape el contenido */
}

/* Estilos de la barra inferior fija */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 5px rgba(0,0,0,0.05);
}

.nav-item {
  text-decoration: none;
  color: #666;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Clase automática que Vue Router pone al enlace activo */
.router-link-active {
  color: #007bff;
}
</style>
<template>
  <div class="page">
    <h2>📦 Registro de Inventario</h2>

    <form @submit.prevent="guardarProducto" class="form-producto">
      <input v-model="nuevoProducto.codigo" type="text" placeholder="Código de barras / ID" required />
      <input v-model="nuevoProducto.nombre" type="text" placeholder="Nombre del producto (Ej: Pan Injerto)" required />
      <input v-model.number="nuevoProducto.precio_compra" type="number" step="0.01" placeholder="Precio de Compra ($)" required />
      <input v-model.number="nuevoProducto.precio_venta" type="number" step="0.01" placeholder="Precio de Venta ($)" required />
      <input v-model.number="nuevoProducto.stock" type="number" placeholder="Stock Inicial" required />
      
      <button type="submit" class="btn-guardar">💾 Guardar en SQLite</button>
    </form>

    <hr />

    <h3>Productos en Base de Datos</h3>
    <button @click="cargarProductos" class="btn-refrescar">🔄 Actualizar Lista</button>

    <div v-if="productos.length === 0" class="no-datos">
      No hay productos registrados aún.
    </div>

    <table v-else class="tabla-productos">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Venta</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="prod in productos" :key="prod.id">
          <td>{{ prod.codigo }}</td>
          <td>{{ prod.nombre }}</td>
          <td>${{ prod.precio_venta.toFixed(2) }}</td>
          <td :class="{ 'sin-stock': prod.stock <= 0 }">{{ prod.stock }} u</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// Reemplaza la línea vieja por esta:
import { getDatabase } from '@/services/db.js' // 📌 Importamos tu puente a SQLite

// Estados reactivos de Vue
const productos = ref([])
const nuevoProducto = ref({
  codigo: '',
  nombre: '',
  precio_compra: '',
  precio_venta: '',
  stock: ''
})

// Función para insertar un producto en la base de datos
async function guardarProducto() {
  try {
    const db = await getDatabase()
    
    await db.execute(
      `INSERT INTO productos (codigo, nombre, precio_compra, precio_venta, stock) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        nuevoProducto.value.codigo,
        nuevoProducto.value.nombre,
        nuevoProducto.value.precio_compra,
        nuevoProducto.value.precio_venta,
        nuevoProducto.value.stock
      ]
    )

    alert('¡Producto guardado localmente con éxito!')
    
    // Limpiamos el formulario y refrescamos la tabla
    nuevoProducto.value = { codigo: '', nombre: '', precio_compra: '', precio_venta: '', stock: '' }
    await cargarProductos()

  } catch (error) {
    console.error('Error al guardar en SQLite:', error)
    alert('Error al guardar: ' + error)
  }
}

// Función para consultar los productos de la base de datos
async function cargarProductos() {
  try {
    const db = await getDatabase()
    // db.select nos devuelve un array de objetos JSON directos desde las filas de SQLite
    productos.value = await db.select('SELECT * FROM productos ORDER BY id DESC')
  } catch (error) {
    console.error('Error al leer de SQLite:', error)
  }
}

// Al cargar la pantalla por primera vez, lee los datos
onMounted(() => {
  cargarProductos()
})
</script>

<style scoped>
.page {
  padding: 15px;
  max-width: 500px;
  margin: 0 auto;
}

.form-producto {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-producto input {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 16px; /* Evita que iOS/Android hagan zoom molesto en inputs */
}

.btn-guardar {
  background-color: #28a745;
  color: white;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}

.btn-refrescar {
  background-color: #007bff;
  color: white;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  margin-bottom: 10px;
}

.tabla-productos {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: white;
}

.tabla-productos th, .tabla-productos td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
  font-size: 14px;
}

.tabla-productos th {
  background-color: #f2f2f2;
}

.sin-stock {
  color: red;
  font-weight: bold;
}

.no-datos {
  text-align: center;
  color: #777;
  padding: 20px;
}
</style>
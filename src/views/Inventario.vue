<template>
  <div class="inventario-page">
    <div class="encabezado">
      <h2>📦 Inventario</h2>
      <button @click="reiniciarFormulario" class="btn-secundario" type="button">
        Nuevo
      </button>
    </div>

    <form @submit.prevent="guardarProducto" class="form-producto" :class="{ editando: productoEditandoId }">
      <div v-if="productoEditandoId" class="modo-edicion">
        Editando producto
      </div>

      <input v-model="form.nombre" type="text" placeholder="Nombre del producto" required />

      <div class="fila-form">
        <input
          v-model.number="form.precio_compra"
          class="input-compra"
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio compra"
          required
        />
        <input
          v-model.number="form.precio_venta"
          class="input-venta"
          type="number"
          min="0"
          step="0.01"
          placeholder="Precio venta"
          required
        />
      </div>

      <div class="fila-form">
        <input
          v-model.number="form.stock"
          type="number"
          min="0"
          step="0.01"
          placeholder="Cantidad"
          required
        />
        <select v-model="form.unidad">
          <option value="unidades">Unidades</option>
          <option value="cajas">Cajas</option>
          <option value="libras">Libras</option>
          <option value="kilos">Kilos</option>
        </select>
      </div>

      <input v-model="form.fecha_compra" type="date" required />
      <textarea v-model="form.detalles" rows="3" placeholder="Detalles opcionales"></textarea>

      <button type="submit" class="btn-guardar">
        {{ productoEditandoId ? 'Actualizar producto' : 'Guardar producto' }}
      </button>
    </form>

    <div class="barra-lista">
      <h3>Productos actuales</h3>
      <button @click="cargarProductos" class="btn-secundario" type="button">
        Actualizar
      </button>
    </div>

    <div v-if="productos.length === 0" class="no-datos">
      No hay productos registrados aún.
    </div>

    <div v-else class="tabla-scroll">
      <table class="tabla-productos">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Cantidad</th>
            <th class="col-compra">Compra</th>
            <th class="col-venta">Venta</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="prod in productos" :key="prod.id">
            <tr>
              <td class="nombre-prod">{{ prod.nombre }}</td>
              <td :class="{ 'sin-stock': Number(prod.stock) <= 0 }">
                {{ formatoCantidad(prod) }}
              </td>
              <td class="precio-compra">${{ formatoDinero(prod.precio_compra) }}</td>
              <td class="precio-venta">${{ formatoDinero(prod.precio_venta) }}</td>
              <td>
                <button @click="conmutarDetalles(prod.id)" class="btn-detalle" type="button">
                  {{ productoDetalleId === prod.id ? 'Ocultar' : 'Ver' }}
                </button>
              </td>
            </tr>

            <tr v-if="productoDetalleId === prod.id" class="fila-detalle">
              <td colspan="5">
                <div class="detalle-box">
                  <div>
                    <strong>Fecha compra:</strong> {{ prod.fecha_compra || 'Sin fecha' }}
                  </div>
                  <div>
                    <strong>Detalles:</strong> {{ prod.detalles || 'Sin detalles' }}
                  </div>
                  <div v-if="prod.fecha_actualizacion">
                    <strong>Ultima actualizacion:</strong> {{ prod.fecha_actualizacion }}
                  </div>

                  <div class="acciones-detalle">
                    <button @click="editarProducto(prod)" class="btn-editar" type="button">
                      Editar
                    </button>
                    <button @click="eliminarProducto(prod)" class="btn-eliminar" type="button">
                      Eliminar
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  actualizarProductoInventario,
  cargarProductosInventario,
  eliminarProductoInventario,
  guardarProductoInventario
} from '@/services/inventarioService.js';

const productos = ref([]);
const productoEditandoId = ref(null);
const productoDetalleId = ref(null);

const formVacio = () => ({
  nombre: '',
  precio_compra: '',
  precio_venta: '',
  stock: '',
  unidad: 'unidades',
  detalles: '',
  fecha_compra: new Date().toISOString().slice(0, 10)
});

const form = ref(formVacio());

function formatoDinero(valor) {
  return (Number(valor) || 0).toFixed(2);
}

function formatoCantidad(prod) {
  const cantidad = Number(prod.stock) || 0;
  return `${cantidad} ${prod.unidad || 'unidades'}`;
}

async function cargarProductos() {
  try {
    productos.value = await cargarProductosInventario();
  } catch (error) {
    console.error('Error al cargar inventario:', error);
    alert('No se pudo cargar el inventario.');
  }
}

async function guardarProducto() {
  if (!form.value.nombre.trim()) {
    alert('Escribe el nombre del producto.');
    return;
  }

  try {
    if (productoEditandoId.value) {
      await actualizarProductoInventario(productoEditandoId.value, form.value);
    } else {
      await guardarProductoInventario(form.value);
    }

    reiniciarFormulario();
    await cargarProductos();
  } catch (error) {
    console.error('Error al guardar inventario:', error);
    alert('No se pudo guardar el producto.');
  }
}

function editarProducto(prod) {
  productoEditandoId.value = prod.id;
  productoDetalleId.value = prod.id;
  form.value = {
    nombre: prod.nombre,
    precio_compra: Number(prod.precio_compra) || 0,
    precio_venta: Number(prod.precio_venta) || 0,
    stock: Number(prod.stock) || 0,
    unidad: prod.unidad || 'unidades',
    detalles: prod.detalles || '',
    fecha_compra: prod.fecha_compra || new Date().toISOString().slice(0, 10)
  };
}

async function eliminarProducto(prod) {
  const confirmar = confirm(`Eliminar "${prod.nombre}" del inventario actual?`);
  if (!confirmar) return;

  try {
    await eliminarProductoInventario(prod.id);
    if (productoEditandoId.value === prod.id) reiniciarFormulario();
    if (productoDetalleId.value === prod.id) productoDetalleId.value = null;
    await cargarProductos();
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    alert('No se pudo eliminar el producto.');
  }
}

function conmutarDetalles(id) {
  productoDetalleId.value = productoDetalleId.value === id ? null : id;
}

function reiniciarFormulario() {
  productoEditandoId.value = null;
  form.value = formVacio();
}

onMounted(cargarProductos);
</script>

<style scoped>
.inventario-page {
  padding: 15px;
  max-width: 760px;
  margin: 0 auto;
  box-sizing: border-box;
}

.encabezado,
.barra-lista {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h2,
h3 {
  margin: 0 0 12px;
  color: #222;
}

.form-producto {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  margin-bottom: 18px;
}

.form-producto.editando {
  border-color: #1f7a3a;
  box-shadow: 0 0 0 3px rgba(31, 122, 58, 0.16);
}

.modo-edicion {
  background: #eaf8ef;
  color: #146c2e;
  border: 1px solid #bfe8cc;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 700;
}

.fila-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  padding: 10px;
  border: 1px solid #cfd4da;
  border-radius: 6px;
  font-size: 15px;
  box-sizing: border-box;
  background: #fff;
}

.input-compra {
  background: #fff5e6;
  border-color: #f2c27b;
  color: #7a4700;
}

.input-compra::placeholder {
  color: #9a5a00;
}

.input-venta {
  background: #eaf8ef;
  border-color: #a9dfba;
  color: #146c2e;
}

.input-venta::placeholder {
  color: #146c2e;
}

textarea {
  resize: vertical;
}

button {
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
}

.btn-guardar {
  background: #1f7a3a;
  color: #fff;
  padding: 12px;
}

.btn-secundario {
  background: #edf2f7;
  color: #2d3748;
  padding: 8px 12px;
}

.tabla-scroll {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e6e6e6;
  border-radius: 8px;
}

.tabla-productos {
  width: 100%;
  border-collapse: collapse;
  min-width: 620px;
}

.tabla-productos th,
.tabla-productos td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 14px;
}

.tabla-productos th {
  background: #f7f7f7;
  color: #444;
}

.nombre-prod {
  font-weight: 700;
  color: #222;
}

.col-compra,
.precio-compra {
  background: #fff5e6;
}

.col-venta,
.precio-venta {
  background: #eaf8ef;
}

.precio-compra {
  color: #9a5a00;
  font-family: monospace;
  font-weight: 700;
}

.precio-venta {
  color: #146c2e;
  font-family: monospace;
  font-weight: 700;
}

.sin-stock {
  color: #dc3545;
  font-weight: 700;
}

.btn-detalle {
  background: #f1f3f5;
  color: #495057;
  padding: 7px 10px;
}

.fila-detalle td {
  background: #fafafa;
}

.detalle-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #444;
}

.acciones-detalle {
  display: flex;
  gap: 8px;
}

.btn-editar {
  background: #0d6efd;
  color: #fff;
  padding: 8px 10px;
}

.btn-eliminar {
  background: #dc3545;
  color: #fff;
  padding: 8px 10px;
}

.no-datos {
  text-align: center;
  color: #777;
  padding: 24px;
}

</style>

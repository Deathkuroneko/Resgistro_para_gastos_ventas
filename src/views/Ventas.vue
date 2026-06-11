<template>
  <div class="ventas-container">
    
    <div class="total-header" :class="{ 'balance-negativo': totalCaja < 0 }">
      <span class="total-label">BALANCE NETO DE HOY</span>
      <span class="total-monto">${{ totalCaja.toFixed(2) }}</span>
    </div>

    <div class="panel-entrada">
      
      <div class="selector-tipo">
        <button 
          @click="tipoMovimiento = 'INGRESO'" 
          type="button" 
          class="btn-tipo ingreso" 
          :class="{ 'activo': tipoMovimiento === 'INGRESO' }"
        >
          🟢 INGRESO (Venta)
        </button>
        <button 
          @click="tipoMovimiento = 'GASTO'" 
          type="button" 
          class="btn-tipo gasto" 
          :class="{ 'activo': tipoMovimiento === 'GASTO' }"
        >
          🔴 GASTO (Salida)
        </button>
      </div>
      
      <div class="form-grupo">
        <label>Concepto o Descripción</label>
        <input 
          v-model="concepto" 
          @input="buscarPlantilla"
          type="text" 
          :placeholder="tipoMovimiento === 'INGRESO' ? 'Ej: Pan Injerto o Venta mañana...' : 'Ej: Compra de levadura, fundas...'"
          class="input-principal"
        />
        
        <ul v-if="sugerencias.length > 0 && tipoMovimiento === 'INGRESO'" class="lista-sugerencias">
          <li v-for="prod in sugerencias" :key="prod.id" @click="seleccionarPlantilla(prod)">
            🍞 {{ prod.nombre }} (Plantilla: ${{ prod.precio_venta.toFixed(2) }})
          </li>
        </ul>
      </div>

      <div class="fila-inputs">
        <div class="input-corto">
          <label>Monto Total ($)</label>
          <input v-model.number="precio" type="number" step="0.01" placeholder="0.00" class="input-num" />
        </div>
        <div class="input-corto">
          <label>Cantidad / Peso (Opcional)</label>
          <input v-model="cantidadInput" type="text" placeholder="Ej: 1 o 2.5kg" class="input-num" />
        </div>
      </div>

      <button @click="guardarEnCaja" class="btn-anadir" :class="tipoMovimiento.toLowerCase()">
        <span v-if="tipoMovimiento === 'INGRESO'">➕ Anotar Ingreso al Cuaderno</span>
        <span v-else>💸 Anotar Gasto al Cuaderno</span>
      </button>
    </div>

    <div class="panel-historial">
      <h3>📋 Renglones Anotados Hoy</h3>
      
      <div v-if="historial.length === 0" class="caja-vacia">
        Ningún movimiento registrado el día de hoy.
      </div>

      <div v-else class="lista-movimientos">
        <div v-for="(item, index) in historial" :key="item.id || index" class="item-movimiento" :class="item.tipo.toLowerCase()">
          
          <div class="mov-info">
            <span class="mov-concepto">{{ item.concepto }}</span>
            <span class="mov-detalles">
              Valor: ${{ item.precio_unitario.toFixed(2) }} 
              <span v-if="item.cantidad && item.cantidad !== '1'"> | Cant: {{ item.cantidad }}</span>
              | <span class="badge-tipo">{{ item.tipo }}</span>
            </span>
          </div>

          <div class="mov-acciones">
            <span class="mov-total">
              {{ item.tipo === 'GASTO' ? '-' : '+' }}${{ item.total.toFixed(2) }}
            </span>
            <button @click="eliminarRegistro(item.id)" class="btn-eliminar">❌</button>
          </div>

        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { guardarRenglonCaja, eliminarRenglonCaja, cargarRenglonesHoy } from '@/services/ventasService.js';

const concepto = ref('');
const precio = ref(0);
// Lo manejamos como texto para aceptar formatos mixtos (ej: "2.5 kg" o dejarlo vacío)
const cantidadInput = ref(''); 
const tipoMovimiento = ref('INGRESO');

const sugerencias = ref([]);
const historial = ref([]);

onMounted(async () => {
  await actualizarHistorial();
});

const totalCaja = computed(() => {
  return historial.value.reduce((acc, item) => {
    if (item.tipo === 'INGRESO') return acc + item.total;
    if (item.tipo === 'GASTO') return acc - item.total;
    return acc;
  }, 0);
});

async function buscarPlantilla() {
  if (!concepto.value) {
    sugerencias.value = [];
    return;
  }
  try {
    const db = await import('@/services/db.js').then(m => m.getDatabase());
    sugerencias.value = await db.select(
      "SELECT * FROM productos WHERE nombre LIKE ? LIMIT 4",
      [`%${concepto.value}%`]
    );
  } catch (err) {
    console.error(err);
  }
}

function seleccionarPlantilla(prod) {
  concepto.value = prod.nombre;
  precio.value = prod.precio_venta;
  sugerencias.value = [];
}

async function actualizarHistorial() {
  historial.value = await cargarRenglonesHoy();
}

async function guardarEnCaja() {
  if (!concepto.value.trim() || precio.value <= 0) {
    alert("Por favor, llena el concepto y el monto.");
    return;
  }

  try {
    // Si está vacío, le asignamos '1' por defecto
    const valorCantidad = cantidadInput.value.trim() === '' ? '1' : cantidadInput.value;

    const nuevoRenglon = {
      concepto: concepto.value,
      tipo: tipoMovimiento.value,
      cantidad: valorCantidad, // Guardamos la cadena tal cual (ej: "1" o "50 panes")
      precio_unitario: precio.value,
      total: precio.value // Ahora el total es directamente el precio ingresado (ya no multiplica)
    };

    await guardarRenglonCaja(nuevoRenglon);

    concepto.value = '';
    precio.value = 0;
    cantidadInput.value = '';
    sugerencias.value = [];
    
    await actualizarHistorial();
  } catch (err) {
    console.error(err);
    alert("No se pudo escribir en el cuaderno de caja.");
  }
}

async function eliminarRegistro(id) {
  try {
    await eliminarRenglonCaja(id);
    await actualizarHistorial();
  } catch (err) {
    console.error(err);
  }
}
</script>

<style scoped>
.ventas-container {
  padding: 15px;
  max-width: 100%;
  box-sizing: border-box;
}

.selector-tipo {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
.btn-tipo {
  flex: 1;
  padding: 12px 10px;
  border: 2px solid #ccc;
  background: #f8f9fa;
  border-radius: 6px;
  font-weight: bold;
  font-size: 13px;
}
.btn-tipo.ingreso.activo {
  border-color: #28a745;
  background: #e2f7e6;
  color: #155724;
}
.btn-tipo.gasto.activo {
  border-color: #dc3545;
  background: #f8d7da;
  color: #721c24;
}

.total-header {
  background-color: #1a1a1a;
  color: #00ff66;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 15px;
}
.total-header.balance-negativo {
  color: #ff3b30;
}
.total-label { font-size: 11px; color: #aaa; font-weight: bold; }
.total-monto { font-size: 32px; font-family: monospace; font-weight: bold; }

.panel-entrada {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 15px;
}

.form-grupo { display: flex; flex-direction: column; gap: 4px; position: relative; }
.form-grupo label { font-size: 12px; color: #666; font-weight: bold; }

.input-principal {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 15px;
  box-sizing: border-box;
}

.lista-sugerencias {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  z-index: 10;
  margin: 0;
  padding: 0;
  list-style: none;
  border-radius: 0 0 6px 6px;
}
.lista-sugerencias li { padding: 10px; border-bottom: 1px solid #eee; font-size: 14px; }

/* Flexbox responsivo para evitar que los inputs rompan la pantalla */
.fila-inputs { 
  display: flex; 
  gap: 10px; 
  margin: 15px 0;
  width: 100%;
  box-sizing: border-box;
}
.input-corto { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  gap: 4px;
  min-width: 0; /* Evita que el contenedor estire de más */
}
.input-corto label { font-size: 12px; color: #666; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.input-num { 
  width: 100%;
  padding: 12px 10px; 
  border: 1px solid #ccc; 
  border-radius: 6px; 
  font-size: 15px; 
  box-sizing: border-box;
}

.btn-anadir {
  width: 100%;
  color: white;
  padding: 14px;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  font-size: 15px;
}
.btn-anadir.ingreso { background-color: #28a745; }
.btn-anadir.gasto { background-color: #dc3545; }

.panel-historial {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.panel-historial h3 { margin-top: 0; font-size: 16px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 8px; }
.caja-vacia { text-align: center; color: #999; padding: 20px; font-style: italic; }

.item-movimiento {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
}
.item-movimiento.ingreso { border-left: 4px solid #28a745; }
.item-movimiento.gasto { border-left: 4px solid #dc3545; }

.mov-info { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mov-concepto { font-weight: bold; color: #222; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mov-detalles { font-size: 12px; color: #666; }
.badge-tipo { font-weight: bold; font-size: 10px; padding: 2px 4px; border-radius: 4px; }
.ingreso .badge-tipo { background: #e2f7e6; color: #155724; }
.gasto .badge-tipo { background: #f8d7da; color: #721c24; }

.mov-acciones { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.mov-total { font-weight: bold; font-family: monospace; font-size: 15px; }
.ingreso .mov-total { color: #28a745; }
.gasto .mov-total { color: #dc3545; }

.btn-eliminar { background: none; border: none; font-size: 14px; padding: 5px; }
</style>
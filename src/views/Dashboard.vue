<template>
  <div class="dashboard-container">
    <h2 class="dash-title">📊 Historial del Cuaderno</h2>

    <div v-if="diasResumen.length === 0" class="caja-vacia">
      Aún no se registran movimientos en el cuaderno de caja.
    </div>

    <div v-else class="lista-tarjetas">
      <div v-for="dia in diasResumen" :key="dia.fecha_corta" class="tarjeta-dia">
        
        <div class="dia-header">
          📅 {{ formatearFechaEspanol(dia.fecha_corta) }}
        </div>

        <div class="dia-cuerpo">
          <div class="fila-resumen">
            <span class="lbl">🟢 Ingresos Totales:</span>
            <span class="val positivo">${{ dia.ingresos.toFixed(2) }}</span>
          </div>
          <div class="fila-resumen">
            <span class="lbl">🔴 Gastos Totales:</span>
            <span class="val negativo">${{ dia.gastos.toFixed(2) }}</span>
          </div>
          
          <div class="fila-neto" :class="{ 'neto-negativo': dia.neto < 0 }">
            <span class="lbl-neto">Balance Final:</span>
            <span class="val-neto">${{ dia.neto.toFixed(2) }}</span>
          </div>
        </div>

        <div class="dia-acciones">
          <div class="btn-group">
            <button @click="conmutarDetalles(dia, 'INGRESO')" class="btn-detalles">
              {{ dia.detallesCargados && dia.detallesFiltro === 'INGRESO' ? '🔼 Ocultar ventas' : '🔽 Ver Ventas' }}
            </button>
            <button @click="conmutarDetalles(dia, 'GASTO')" class="btn-detalles">
              {{ dia.detallesCargados && dia.detallesFiltro === 'GASTO' ? '🔼 Ocultar gastos' : '🔽 Ver Gastos' }}
            </button>
            <button @click="conmutarDetalles(dia, null)" class="btn-detalles">
              {{ dia.detallesCargados && dia.detallesFiltro === null ? '🔼 Ocultar todos' : '🔽 Ver Todos' }}
            </button>
          </div>
        </div>

        <div v-if="dia.detallesCargados" class="desplegable-detalles">
          <div v-for="mov in dia.detalles" :key="mov.id" class="renglon-mini" :class="mov.tipo.toLowerCase()">
            <div class="mini-izq">
              <span class="mini-concepto">{{ mov.concepto }}</span>
              <span class="mini-hora">⏱️ {{ mov.fecha.split(' ')[1] }}</span>
            </div>
            <span class="mini-monto">
              {{ mov.tipo === 'GASTO' ? '-' : '+' }}${{ mov.total.toFixed(2) }}
            </span>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { cargarResumenDias, cargarDetallesDia } from '@/services/dashboardService.js';

const diasResumen = ref([]);

onMounted(async () => {
  diasResumen.value = await cargarResumenDias();
});

// Función Lazy: No lee la base de datos para detalles hasta que el usuario hace clic
// Ahora acepta un filtro opcional `tipo` ('INGRESO' | 'GASTO' | null)
async function conmutarDetalles(dia, tipo = null) {
  // Si ya está abierto con el mismo filtro, lo cerramos
  if (dia.detallesCargados && dia.detallesFiltro === tipo) {
    dia.detallesCargados = false;
    dia.detallesFiltro = null;
    return;
  }

  // Si no se han cargado antes, o el filtro cambió, recargamos con el filtro solicitado
  if (dia.detalles.length === 0 || dia.detallesFiltro !== tipo) {
    dia.detalles = await cargarDetallesDia(dia.fecha_corta, tipo);
    dia.detallesFiltro = tipo;
  }

  dia.detallesCargados = true;
}

// Convierte "2026-06-16" a "Martes, 16 de Junio del 2026" usando la zona horaria de Ecuador
function formatearFechaEspanol(fechaStr) {
  const partes = fechaStr.split('-');
  const fechaObjeto = new Date(partes[0], partes[1] - 1, partes[2]);
  
  return fechaObjeto.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<style scoped>
.dashboard-container {
  padding: 15px;
  max-width: 100%;
  box-sizing: border-box;
}
.dash-title {
  font-size: 20px;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}
.caja-vacia {
  text-align: center;
  color: #999;
  padding: 30px;
  font-style: italic;
}
.lista-tarjetas {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.tarjeta-dia {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 3px 6px rgba(0,0,0,0.05);
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.dia-header {
  background: #f1f3f5;
  padding: 12px;
  font-weight: bold;
  font-size: 14px;
  color: #495057;
  border-bottom: 1px solid #e8e8e8;
  text-transform: capitalize;
}
.dia-cuerpo {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fila-resumen {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.lbl { color: #666; }
.val { font-weight: bold; font-family: monospace; }
.val.positivo { color: #28a745; }
.val.negativo { color: #dc3545; }

.fila-neto {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  padding-top: 8px;
  border-top: 1px dashed #e8e8e8;
}
.lbl-neto { font-weight: bold; color: #222; }
.val-neto { font-weight: bold; font-size: 16px; color: #28a745; font-family: monospace; }
.neto-negativo .val-neto { color: #dc3545; }

.dia-acciones {
  padding: 0 12px 12px 12px;
}
.btn-detalles {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #ced4da;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  color: #6c757d;
}

/* Desplegable perezoso moderno */
.desplegable-detalles {
  background: #fafafa;
  border-top: 1px solid #eee;
  padding: 5px 12px;
}
.renglon-mini {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
}
.renglon-mini:last-child { border-bottom: none; }
.mini-izq { display: flex; flex-direction: column; gap: 2px; }
.mini-concepto { font-size: 13px; font-weight: 500; color: #333; }
.mini-hora { font-size: 11px; color: #999; }
.mini-monto { font-size: 13px; font-weight: bold; font-family: monospace; }
.ingreso .mini-monto { color: #28a745; }
.gasto .mini-monto { color: #dc3545; }
/* Botones de filtro en fila */
.btn-group { display: flex; gap: 8px; }
.btn-group .btn-detalles { width: auto; flex: 1; }
</style>
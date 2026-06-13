import { getDatabase } from './db.js';

function obtenerRangoDia(fechaCorta) {
  const [year, month, day] = fechaCorta.split('-').map(Number);
  const inicio = new Date(year, month - 1, day);
  const fin = new Date(year, month - 1, day + 1);
  const formatear = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return {
    inicio: `${formatear(inicio)} 00:00:00`,
    fin: `${formatear(fin)} 00:00:00`
  };
}

/**
 * Obtiene el resumen agrupado por días (Fechas únicas en las que hay registros)
 * Realiza un cálculo limpio de ingresos, gastos y balance neto diario.
 */
export async function cargarResumenDias() {
  const db = await getDatabase();
  try {
    const resumen = await db.select(`
      SELECT
        SUBSTR(fecha, 1, 10) as fecha_corta,
        COALESCE(SUM(CASE WHEN tipo = 'INGRESO' THEN total ELSE 0 END), 0) as ingresos,
        COALESCE(SUM(CASE WHEN tipo = 'GASTO' THEN total ELSE 0 END), 0) as gastos
      FROM registro_caja
      GROUP BY fecha_corta
      ORDER BY fecha_corta DESC
    `);

    return resumen.map((dia) => {
      const ingresos = Number(dia.ingresos) || 0;
      const gastos = Number(dia.gastos) || 0;

      return {
        fecha_corta: dia.fecha_corta,
        ingresos,
        gastos,
        neto: ingresos - gastos,
        detallesCargados: false, // Control para Lazy Load en la interfaz
        detalles: [],
        detallesFiltro: null
      };
    });
  } catch (error) {
    console.error("❌ Error en resumen por días (Dashboard):", error);
    return [];
  }
}

/**
 * Carga de forma perezosa (Lazy Load) los movimientos específicos de una fecha elegida
 */
export async function cargarDetallesDia(fechaCorta, tipo = null) {
  const db = await getDatabase();
  try {
    const { inicio, fin } = obtenerRangoDia(fechaCorta);

    if (tipo) {
      return await db.select(
        "SELECT * FROM registro_caja WHERE fecha >= ? AND fecha < ? AND tipo = ? ORDER BY id ASC",
        [inicio, fin, tipo]
      );
    }

    return await db.select(
      "SELECT * FROM registro_caja WHERE fecha >= ? AND fecha < ? ORDER BY id ASC",
      [inicio, fin]
    );
  } catch (error) {
    console.error("❌ Error al cargar detalles específicos en el Dashboard:", error);
    return [];
  }
}

import { getDatabase } from './db.js';

/**
 * Obtiene el resumen agrupado por días (Fechas únicas en las que hay registros)
 * Realiza un cálculo limpio de ingresos, gastos y balance neto diario.
 */
export async function cargarResumenDias() {
  const db = await getDatabase();
  try {
    // Extrae la parte YYYY-MM-DD única de la columna fecha
    const dias = await db.select(`
      SELECT DISTINCT SUBSTR(fecha, 1, 10) as fecha_corta 
      FROM registro_caja 
      ORDER BY fecha_corta DESC
    `);

    let resumenCompleto = [];

    for (const d of dias) {
      const fecha = d.fecha_corta;

      // Calculamos ingresos totales de ese día
      const resIngresos = await db.select(
        "SELECT SUM(total) as total FROM registro_caja WHERE fecha LIKE ? AND tipo = 'INGRESO'",
        [`${fecha}%`]
      );
      
      // Calculamos gastos totales de ese día
      const resGastos = await db.select(
        "SELECT SUM(total) as total FROM registro_caja WHERE fecha LIKE ? AND tipo = 'GASTO'",
        [`${fecha}%`]
      );

      const ingresos = resIngresos[0]?.total || 0;
      const gastos = resGastos[0]?.total || 0;
      const neto = ingresos - gastos;

      resumenCompleto.push({
        fecha_corta: fecha,
        ingresos,
        gastos,
        neto,
        detallesCargados: false, // Control para Lazy Load en la interfaz
        detalles: [],
        detallesFiltro: null
      });
    }

    return resumenCompleto;
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
    if (tipo) {
      return await db.select(
        "SELECT * FROM registro_caja WHERE fecha LIKE ? AND tipo = ? ORDER BY id ASC",
        [`${fechaCorta}%`, tipo]
      );
    }

    return await db.select(
      "SELECT * FROM registro_caja WHERE fecha LIKE ? ORDER BY id ASC",
      [`${fechaCorta}%`]
    );
  } catch (error) {
    console.error("❌ Error al cargar detalles específicos en el Dashboard:", error);
    return [];
  }
}
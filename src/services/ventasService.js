import { getDatabase } from './db.js';

/**
 * Obtiene la fecha y hora local exacta del dispositivo en formato YYYY-MM-DD HH:MM:SS
 */
function obtenerFechaHoraLocal() {
  const d = new Date();
  const hoyCorto = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const horaCorta = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return `${hoyCorto} ${horaCorta}`;
}

function obtenerRangoDiaLocal(fecha = new Date()) {
  const inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1);
  const formatear = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  return {
    inicio: `${formatear(inicio)} 00:00:00`,
    fin: `${formatear(fin)} 00:00:00`
  };
}

/**
 * Inserta un renglón de movimiento (Ingreso o Gasto) directamente en el cuaderno de caja
 */
export async function guardarRenglonCaja(item) {
  const db = await getDatabase();
  try {
    const ahoraLocal = obtenerFechaHoraLocal();
    const totalCalculado = item.cantidad * item.precio_unitario;

    // En Tauri v2 con SQLite, usamos '?' como marcador de posición
    await db.execute(
      `INSERT INTO registro_caja (fecha, concepto, tipo, cantidad, precio_unitario, total) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ahoraLocal, 
        item.concepto.trim(), 
        item.tipo, // 'INGRESO' o 'GASTO'
        item.cantidad, 
        item.precio_unitario,
        totalCalculado
      ]
    );

    // Retornamos el ID recién creado por si la interfaz lo necesita
    const ultimoId = await db.select("SELECT last_insert_rowid() as id");
    return ultimoId[0].id;
  } catch (error) {
    console.error("❌ Error al guardar movimiento en caja:", error);
    throw error;
  }
}

/**
 * Elimina un renglón físico del cuaderno de caja por su ID
 */
export async function eliminarRenglonCaja(id) {
  const db = await getDatabase();
  try {
    await db.execute("DELETE FROM registro_caja WHERE id = ?", [id]);
  } catch (error) {
    console.error("❌ Error al eliminar movimiento de la caja:", error);
    throw error;
  }
}

/**
 * Recupera todos los renglones guardados el día de hoy (según hora local) para redibujar la pantalla
 */
export async function cargarRenglonesHoy() {
  const db = await getDatabase();
  try {
    const { inicio, fin } = obtenerRangoDiaLocal();

    return await db.select(
      "SELECT * FROM registro_caja WHERE fecha >= ? AND fecha < ? ORDER BY id DESC",
      [inicio, fin]
    );
  } catch (error) {
    console.error("❌ Error al recuperar los renglones de hoy:", error);
    return [];
  }
}

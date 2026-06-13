import { getDatabase } from './db.js';

function obtenerFechaHoraLocal() {
  const d = new Date();
  const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return `${fecha} ${hora}`;
}

function limpiarProducto(producto) {
  return {
    nombre: producto.nombre.trim(),
    precio_compra: Number(producto.precio_compra) || 0,
    precio_venta: Number(producto.precio_venta) || 0,
    stock: Number(producto.stock) || 0,
    unidad: producto.unidad || 'unidades',
    detalles: producto.detalles?.trim() || '',
    fecha_compra: producto.fecha_compra || obtenerFechaHoraLocal().slice(0, 10)
  };
}

async function registrarHistorial(db, accion, producto) {
  const unidad = producto.unidad || 'unidades';
  const detalles = producto.detalles || '';
  const precioCompra = Number(producto.precio_compra) || 0;
  const precioVenta = Number(producto.precio_venta) || 0;
  const stock = Number(producto.stock) || 0;
  const fechaCompra = producto.fecha_compra || obtenerFechaHoraLocal().slice(0, 10);

  await db.execute(
    `INSERT INTO productos_historial (
      producto_id,
      accion,
      nombre,
      precio_compra,
      precio_venta,
      stock,
      unidad,
      detalles,
      fecha_compra,
      fecha_accion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      producto.id,
      accion,
      producto.nombre,
      precioCompra,
      precioVenta,
      stock,
      unidad,
      detalles,
      fechaCompra,
      obtenerFechaHoraLocal()
    ]
  );
}

export async function cargarProductosInventario() {
  const db = await getDatabase();
  return await db.select('SELECT * FROM productos ORDER BY id DESC');
}

export async function guardarProductoInventario(producto) {
  const db = await getDatabase();
  const datos = limpiarProducto(producto);
  const ahora = obtenerFechaHoraLocal();

  await db.execute(
    `INSERT INTO productos (
      nombre,
      precio_compra,
      precio_venta,
      stock,
      unidad,
      detalles,
      fecha_compra,
      fecha_actualizacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.nombre,
      datos.precio_compra,
      datos.precio_venta,
      datos.stock,
      datos.unidad,
      datos.detalles,
      datos.fecha_compra,
      ahora
    ]
  );

  const ultimoId = await db.select('SELECT last_insert_rowid() as id');
  const creado = { id: ultimoId[0].id, ...datos };
  await registrarHistorial(db, 'CREADO', creado);

  return creado.id;
}

export async function actualizarProductoInventario(id, producto) {
  const db = await getDatabase();
  const datos = limpiarProducto(producto);
  const ahora = obtenerFechaHoraLocal();

  await db.execute(
    `UPDATE productos
     SET nombre = ?,
         precio_compra = ?,
         precio_venta = ?,
         stock = ?,
         unidad = ?,
         detalles = ?,
         fecha_compra = ?,
         fecha_actualizacion = ?
     WHERE id = ?`,
    [
      datos.nombre,
      datos.precio_compra,
      datos.precio_venta,
      datos.stock,
      datos.unidad,
      datos.detalles,
      datos.fecha_compra,
      ahora,
      id
    ]
  );

  await registrarHistorial(db, 'EDITADO', { id, ...datos });
}

export async function eliminarProductoInventario(id) {
  const db = await getDatabase();
  const productos = await db.select('SELECT * FROM productos WHERE id = ?', [id]);
  const producto = productos[0];

  if (!producto) return;

  await registrarHistorial(db, 'ELIMINADO', producto);
  await db.execute('DELETE FROM productos WHERE id = ?', [id]);
}

import Database from '@tauri-apps/plugin-sql';

let db = null;

// 1. Función para obtener la instancia de la base de datos abierta
export async function getDatabase() {
  if (!db) {
    // Cargamos el archivo de la base de datos local
    db = await Database.load('sqlite:ventas.db');
  }
  return db;
}

async function agregarColumnaSiNoExiste(database, tabla, columna, definicion) {
  const columnas = await database.select(`PRAGMA table_info(${tabla})`);
  const existe = columnas.some((col) => col.name === columna);

  if (!existe) {
    await database.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
  }
}

// 2. Función para inicializar las tablas desde cero
export async function initDatabase() {
  const database = await getDatabase();
  
  console.log("🛠️ Inicializando base de datos...");

  // Creamos la tabla del cuaderno de caja independiente
  await database.execute(`
      CREATE TABLE IF NOT EXISTS registro_caja (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fecha TEXT NOT NULL,           -- Formato: YYYY-MM-DD HH:MM:SS
        concepto TEXT NOT NULL,
        tipo TEXT NOT NULL,            -- 'INGRESO' o 'GASTO'
        cantidad TEXT,                 -- 💡 Cambiado a TEXT para permitir datos opcionales o unidades
        precio_unitario REAL NOT NULL,
        total REAL NOT NULL            
      );
    `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_registro_caja_fecha_tipo
    ON registro_caja (fecha, tipo);
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_registro_caja_tipo_fecha
    ON registro_caja (tipo, fecha);
  `);

  // Creamos la tabla de productos (sirve como plantilla de autocompletado rápido)
  await database.execute(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio_compra REAL DEFAULT 0,
      precio_venta REAL NOT NULL,
      stock REAL NOT NULL,
      unidad TEXT DEFAULT 'unidades',
      detalles TEXT,
      fecha_compra TEXT,
      fecha_actualizacion TEXT
    );
  `);

  await agregarColumnaSiNoExiste(database, 'productos', 'precio_compra', 'REAL DEFAULT 0');
  await agregarColumnaSiNoExiste(database, 'productos', 'unidad', "TEXT DEFAULT 'unidades'");
  await agregarColumnaSiNoExiste(database, 'productos', 'detalles', 'TEXT');
  await agregarColumnaSiNoExiste(database, 'productos', 'fecha_compra', 'TEXT');
  await agregarColumnaSiNoExiste(database, 'productos', 'fecha_actualizacion', 'TEXT');

  await database.execute(`
    CREATE TABLE IF NOT EXISTS productos_historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER,
      accion TEXT NOT NULL,             -- 'CREADO', 'EDITADO' o 'ELIMINADO'
      nombre TEXT NOT NULL,
      precio_compra REAL DEFAULT 0,
      precio_venta REAL NOT NULL,
      stock REAL NOT NULL,
      unidad TEXT DEFAULT 'unidades',
      detalles TEXT,
      fecha_compra TEXT,
      fecha_accion TEXT NOT NULL
    );
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_productos_historial_producto_fecha
    ON productos_historial (producto_id, fecha_accion);
  `);

  // Inyectamos productos de prueba si la tabla está vacía
  const prods = await database.select("SELECT COUNT(*) as count FROM productos");
  if (prods[0].count === 0) {
    console.log("📦 Inyectando productos de prueba como plantillas...");
    await database.execute(`
      INSERT INTO productos (nombre, precio_venta, stock) VALUES 
      ('Pan Injerto', 0.15, 100),
      ('Pan de Ambato', 0.18, 100),
      ('Pan de Dulce (Costra)', 0.25, 100),
      ('Pan de Queso Extra', 0.35, 100),
      ('Queso de Hoja', 1.50, 20),
      ('Litro de Leche', 1.00, 30);
    `);
    console.log("¡Seeding completado!");
  }
}

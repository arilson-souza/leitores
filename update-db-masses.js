const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'parish.db');
const db = new Database(dbPath);

console.log('Iniciando migração de banco de dados para Missas Especiais...');
try {
  const addColumnIfNotExists = (table, column, type) => {
    const tableInfo = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = tableInfo.some(col => col.name === column);
    if (!exists) {
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
      console.log(`Coluna ${table}.${column} adicionada com sucesso!`);
    } else {
      console.log(`A coluna ${table}.${column} já existe.`);
    }
  };

  addColumnIfNotExists('masses', 'name', 'TEXT');
  addColumnIfNotExists('masses', 'required_readers', 'INTEGER');

  addColumnIfNotExists('schedules', 'reader_3_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');
  addColumnIfNotExists('schedules', 'reader_4_id', 'INTEGER REFERENCES users(id) ON DELETE SET NULL');

} catch (error) {
  console.error('Erro ao atualizar esquema:', error.message);
} finally {
  db.close();
}

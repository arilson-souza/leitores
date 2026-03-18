const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'parish.db');
const db = new Database(dbPath);

console.log('Iniciando migração de banco de dados para schedule_months...');
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS schedule_months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, month)
    );
  `).run();
  
  console.log('Tabela schedule_months garantida com sucesso!');
} catch (error) {
  console.error('Erro ao atualizar esquema:', error.message);
} finally {
  db.close();
}

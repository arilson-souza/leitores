const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'parish.db');
const db = new Database(dbPath);

console.log('Iniciando migração de banco de dados para users (licenças)...');
try {
  // Add new columns to the users table
  const columnsToAdd = [
    { name: 'status', type: "TEXT DEFAULT 'ATIVO'" },
    { name: 'leave_start', type: 'TEXT' },
    { name: 'leave_end', type: 'TEXT' },
    { name: 'leave_reason', type: 'TEXT' }
  ];

  for (const col of columnsToAdd) {
    try {
      db.prepare(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`).run();
      console.log(`Coluna ${col.name} adicionada com sucesso.`);
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log(`Coluna ${col.name} já existe.`);
      } else {
        throw err;
      }
    }
  }
  
  console.log('Migração de usuário finalizada com sucesso!');
} catch (error) {
  console.error('Erro ao atualizar esquema:', error.message);
} finally {
  db.close();
}

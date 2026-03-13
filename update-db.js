const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'parish.db');
const db = new Database(dbPath);

console.log('Iniciando migração de banco de dados...');
try {
  // Check if column exists
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasAvatar = tableInfo.some(col => col.name === 'avatar_url');

  if (!hasAvatar) {
    db.prepare('ALTER TABLE users ADD COLUMN avatar_url TEXT').run();
    console.log('Coluna avatar_url adicionada com sucesso!');
  } else {
    console.log('A coluna avatar_url já existe.');
  }
} catch (error) {
  console.error('Erro ao atualizar esquema:', error.message);
} finally {
  db.close();
}

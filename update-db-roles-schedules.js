const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'parish.db');
const db = new Database(dbPath);

console.log('Iniciando migração de banco de dados para Regras de Missas Solenes e Funções de Disponibilidade...');

try {
  // 1. Atualizar tabela availabilities com a coluna role
  const availInfo = db.prepare("PRAGMA table_info(availabilities)").all();
  const hasRole = availInfo.some(col => col.name === 'role');
  
  if (!hasRole) {
    db.prepare("ALTER TABLE availabilities ADD COLUMN role TEXT DEFAULT 'AMBOS'").run();
    console.log('Coluna role adicionada à tabela availabilities com sucesso!');
  } else {
    console.log('A coluna role já existe na tabela availabilities.');
  }

  // 2. Atualizar tabela schedules com as colunas reader_5_id a reader_7_id
  const scheduleInfo = db.prepare("PRAGMA table_info(schedules)").all();
  
  const hasReader5 = scheduleInfo.some(col => col.name === 'reader_5_id');
  if (!hasReader5) {
    db.prepare("ALTER TABLE schedules ADD COLUMN reader_5_id INTEGER").run();
    console.log('Coluna reader_5_id adicionada à tabela schedules.');
  }
  
  const hasReader6 = scheduleInfo.some(col => col.name === 'reader_6_id');
  if (!hasReader6) {
    db.prepare("ALTER TABLE schedules ADD COLUMN reader_6_id INTEGER").run();
    console.log('Coluna reader_6_id adicionada à tabela schedules.');
  }
  
  const hasReader7 = scheduleInfo.some(col => col.name === 'reader_7_id');
  if (!hasReader7) {
    db.prepare("ALTER TABLE schedules ADD COLUMN reader_7_id INTEGER").run();
    console.log('Coluna reader_7_id adicionada à tabela schedules.');
  }

  console.log('Migrações concluídas com sucesso!');

} catch (error) {
  console.error('Erro ao atualizar esquema:', error.message);
} finally {
  db.close();
}

import bcrypt from 'bcryptjs';

export function runMigrations(db) {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      role TEXT DEFAULT 'VOLUNTARIO',
      can_be_reader BOOLEAN DEFAULT 1,
      can_be_animator BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create availabilities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS availabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      mass_date TEXT NOT NULL,
      mass_time TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Create masses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS masses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mass_date TEXT NOT NULL,
      mass_time TEXT NOT NULL,
      day_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mass_date, mass_time)
    );
  `);

  // Create schedules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mass_id INTEGER NOT NULL,
      reader_1_id INTEGER,
      reader_2_id INTEGER,
      animator_id INTEGER,
      status TEXT DEFAULT 'PLANNED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mass_id) REFERENCES masses(id) ON DELETE CASCADE,
      FOREIGN KEY (reader_1_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_2_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (animator_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Seed default admin user
  const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@paroquia.com');
  if (!checkAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, can_be_reader, can_be_animator)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Administrador', 'admin@paroquia.com', hash, 'ADMIN', 1, 1);
    console.log('Seeded default admin user: admin@paroquia.com / admin123');
  }
}

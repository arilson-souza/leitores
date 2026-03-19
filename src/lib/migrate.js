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
      status TEXT DEFAULT 'ATIVO',
      leave_start TEXT,
      leave_end TEXT,
      leave_reason TEXT,
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
      role TEXT DEFAULT 'AMBOS',
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
      name TEXT,
      required_readers INTEGER DEFAULT 2,
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
      reader_3_id INTEGER,
      reader_4_id INTEGER,
      reader_5_id INTEGER,
      reader_6_id INTEGER,
      reader_7_id INTEGER,
      animator_id INTEGER,
      status TEXT DEFAULT 'PLANNED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (mass_id) REFERENCES masses(id) ON DELETE CASCADE,
      FOREIGN KEY (reader_1_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_2_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_3_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_4_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_5_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_6_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (reader_7_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (animator_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS schedule_months (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(year, month)
    );
  `);

  // Create default admin user if it doesn't exist
  const checkAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@paroquia.com');
  if (!checkAdmin) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, can_be_reader, can_be_animator)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Coordenador', 'admin@paroquia.com', hash, 'ADMIN', 1, 1);
    console.log('Seeded default admin user: admin@paroquia.com / admin123');
  }
}

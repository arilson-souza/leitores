import { getDb } from '@/lib/db';
import { hashPassword, createToken, setSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'As senhas não conferem' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, can_be_reader, can_be_animator)
      VALUES (?, ?, ?, 'VOLUNTARIO', 1, 1)
    `).run(name, email, hashedPassword);

    const newUser = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Create session
    const token = await createToken(newUser);
    await setSession(token);

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

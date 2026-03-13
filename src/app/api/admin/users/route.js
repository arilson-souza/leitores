import { getDb } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const db = getDb();
  try {
    const users = db.prepare('SELECT id, name, email, avatar_url, role, can_be_reader, can_be_animator, created_at FROM users ORDER BY name ASC').all();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Erro interno ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { name, email, password, role, can_be_reader, can_be_animator, avatar_url } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, email e senha são obrigatórios' }, { status: 400 });
    }

    const db = getDb();

    // Check if email exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    const hashed = await hashPassword(password);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'VOLUNTARIO';
    const isReader = can_be_reader ? 1 : 0;
    const isAnimator = can_be_animator ? 1 : 0;
    const avatar = avatar_url || null;

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, avatar_url, role, can_be_reader, can_be_animator)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, hashed, avatar, userRole, isReader, isAnimator);

    return NextResponse.json({ success: true, message: 'Usuário adicionado com sucesso', userId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Erro ao adicionar usuário' }, { status: 500 });
  }
}

import { getDb } from '@/lib/db';
import { verifyPassword, createToken, setSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 });
    }

    const db = getDb();
    
    const user = db.prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ?').get(email);
    
    if (!user) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos, tente novamente' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: 'E-mail ou senha inválidos, tente novamente' }, { status: 401 });
    }

    // Create session
    const { password_hash, ...userWithoutPassword } = user;
    const token = await createToken(userWithoutPassword);
    await setSession(token);

    return NextResponse.json({ user: userWithoutPassword }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

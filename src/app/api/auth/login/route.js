import { getDb } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth';
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
    
    const response = NextResponse.json({ user: userWithoutPassword }, { status: 200 });
    
    // Set the cookie directly on the response to ensure it's sent to the client
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.HTTPS !== 'false',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24h
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message }, 
      { status: 500 }
    );
  }
}

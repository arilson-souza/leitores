import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  // Fetch latest data from database to get avatar
  const { getDb } = require('@/lib/db');
  const db = getDb();
  const dbUser = db.prepare('SELECT id, name, email, role, avatar_url, can_be_reader, can_be_animator FROM users WHERE id = ?').get(session.id);

  if (!dbUser) {
    return NextResponse.json({ error: 'Usuário não encontrado no banco de dados' }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser });
}

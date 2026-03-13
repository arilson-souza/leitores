import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mass_id = searchParams.get('mass_id');

  if (!mass_id) return NextResponse.json({ error: 'mass_id requerido' }, { status: 400 });

  const db = getDb();

  try {
    const mass = db.prepare('SELECT mass_date, mass_time FROM masses WHERE id = ?').get(mass_id);
    if (!mass) return NextResponse.json({ error: 'Missa não encontrada' }, { status: 404 });

    const availableUsers = db.prepare(`
      SELECT u.id, u.name, u.can_be_reader, u.can_be_animator
      FROM availabilities a
      JOIN users u ON a.user_id = u.id
      WHERE a.mass_date = ? AND a.mass_time = ?
    `).all(mass.mass_date, mass.mass_time);

    return NextResponse.json({ availableUsers });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

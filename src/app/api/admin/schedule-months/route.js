import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) return NextResponse.json({ error: 'Ano e mês requeridos' }, { status: 400 });

  const db = getDb();
  try {
    let monthStatus = db.prepare('SELECT status FROM schedule_months WHERE year = ? AND month = ?').get(year, month);
    if (!monthStatus) {
      // Default to OPEN if not explicitly set yet
      monthStatus = { status: 'OPEN' };
    }
    return NextResponse.json({ status: monthStatus.status });
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { year, month, status } = await request.json();
    if (!year || !month || !status) return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });

    const db = getDb();
    
    // Upsert equivalent since standard SQLite might require explicitly checking or INSERT ON CONFLICT
    db.prepare(`
      INSERT INTO schedule_months (year, month, status)
      VALUES (?, ?, ?)
      ON CONFLICT(year, month) DO UPDATE SET status = excluded.status
    `).run(year, month, status);

    return NextResponse.json({ success: true, message: 'Status atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
